# Deploy do backend

Este documento descreve a esteira de CI/CD do backend (`.github/workflows/ci.yml` +
`.github/workflows/release-backend.yml`), a imagem Docker de produção (`Dockerfile`), e
o processo de rollback. Ambiente local (Docker Compose) é outro documento —
ver [local-setup.md](./local-setup.md).

> **Histórico (2026-10-26):** o workflow de deploy já se chamou `deploy-backend.yml`
> e nunca rodou um job sequer — todas as 11+ execuções falhavam instantaneamente
> (0s, 0 jobs, nenhum log). Investigação longa, resumo:
> - "Workflow permissions" do repo estava em somente-leitura pra `packages`
>   (Settings → Actions → General) — corrigido pra "Read and write permissions",
>   mas sozinho **não resolveu**.
> - Renomear o arquivo pra `release-backend.yml` (forçando um `workflow_id` novo)
>   também **não resolveu sozinho** — o mesmo arquivo com um ID genuinamente novo
>   continuou falhando do mesmo jeito.
> - Isolei bisectando o conteúdo num workflow de teste: o job `build-and-push`
>   sozinho (checkout + docker login/buildx/build-push, com `permissions` e
>   `concurrency`) **funciona perfeitamente**. Adicionar os jobs `migrate`/`deploy`
>   de volta é o que trava tudo de novo.
> - O editor (extensão de GitHub Actions) aponta `secrets` em `if:` de **job**
>   (não de step) como inválido nesses dois jobs — mas mover o check pra `if:` de
>   **step** (sintaxe que a extensão aceita) **também não resolveu** quando testei.
> - Conclusão: a causa exata de `migrate`/`deploy` quebrarem o workflow não foi
>   encontrada. Removi os dois jobs do arquivo real (ver abaixo) pra desbloquear
>   a publicação da imagem, que é o que importa agora. Antes de reativá-los,
>   bisectar de novo num workflow de teste separado (não editar `release-backend.yml`
>   direto) — suspeitas que ainda não testei: `needs:` encadeado (3 jobs em
>   cadeia vs. 1 job sozinho), ou `defaults.run.working-directory` com o acento
>   de "Código-fonte" especificamente dentro de um job que depende de outro via
>   `needs`.

## Visão geral: CI vs CD

Dois workflows, dois momentos diferentes:

- **`ci.yml`** — gate de qualidade, roda em toda Pull Request contra `main` (e de novo
  em todo push em `main`, como segurança extra). Lint, typecheck, testes unitários
  (com piso de cobertura no domínio), testes e2e, e o build de produção
  (`npm run build`). Falha em qualquer etapa bloqueia o merge — não existe passo que
  "sempre passa" pra mascarar teste quebrado ou lint falhando.
- **`release-backend.yml`** — só roda depois de um push em `main` (ou seja, depois que
  o PR já passou pelo `ci.yml`). Builda a imagem Docker de produção e publica no
  GitHub Container Registry. Só isso por enquanto — os jobs `migrate` (aplicar
  migrations) e `deploy` (publicar no host) foram removidos do arquivo (ver nota
  no topo deste documento) até a causa de quebrarem o workflow ser encontrada;
  hoje migrations de produção rodam manualmente (ver
  [Migrations no deploy](#migrations-no-deploy)) e o host (Render) puxa a imagem
  publicada aqui por conta própria.

A suíte de testes que roda no CI é a suíte real do projeto hoje — não é um placeholder
provisório. Conforme mais e2e/unit forem escritos (módulos ainda em desenvolvimento,
ex. autenticação), eles entram automaticamente no `npm run test:cov` / `npm run
test:e2e` sem precisar mexer no workflow.

## Imagem Docker de produção

`Código-fonte/backend/Dockerfile` — multi-stage (`deps` → `build` → `runtime`):

- Base `node:20-bookworm-slim` nos três estágios (não alpine — ver comentário no
  topo do Dockerfile: bcrypt e o motor do Prisma têm atrito conhecido com musl
  libc/OpenSSL do alpine).
- `npm ci` (nunca `npm install`) — build determinístico a partir do
  `package-lock.json`.
- `prisma generate` roda no estágio `build`, contra a mesma base do estágio
  `runtime` — o client gerado (com o binário do motor de query certo) é copiado
  via `node_modules`, sem precisar gerar de novo no runtime.
- `npm prune --omit=dev` remove devDependencies (typescript, jest, eslint, a CLI
  do prisma etc.) antes de copiar pro estágio final — a imagem final não carrega
  nada disso, nem código-fonte (`src/`), nem testes.
- Roda como usuário `node` (uid 1000, já vem nas imagens oficiais — não é um
  usuário criado à mão neste Dockerfile).
- `HEALTHCHECK` aponta pro `GET /health` já existente (`HealthController` —
  confere conectividade com o Postgres via `SELECT 1`, devolve 503 se falhar).

Build e run local, pra validar sem precisar do pipeline:

```bash
cd Código-fonte/backend
docker build -t atlas-backend:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://atlas:atlas@host.docker.internal:5433/atlas_nova_clean?schema=public" \
  -e JWT_SECRET="troque-por-um-valor-de-verdade-com-16-chars-ou-mais" \
  atlas-backend:local
```

(`host.docker.internal` aponta pro Postgres rodando no host, seja o embarcado do
`npm run dev` seja o do `docker compose` do ambiente local — ver
[local-setup.md](./local-setup.md).)

### Publicação (GitHub Container Registry)

`release-backend.yml` builda e publica em `ghcr.io/killa9vv/atlas_nova_clean-main/backend`,
tagueada com o SHA do commit **e** `latest`:

```
ghcr.io/killa9vv/atlas_nova_clean-main/backend:<sha-do-commit>
ghcr.io/killa9vv/atlas_nova_clean-main/backend:latest
```

Usa o `GITHUB_TOKEN` automático do Actions (via `permissions: packages: write`) —
nenhum secret novo precisa ser criado pra este passo funcionar. O pacote fica
visível em `https://github.com/killa9vv/ATLAS_Nova_Clean-main/pkgs/container/atlas_nova_clean-main%2Fbackend`
(pode precisar ser marcado como público manualmente na primeira publicação, senão
fica privado por padrão).

## Migrations no deploy

> **Hoje (temporário):** o job `migrate` abaixo foi removido de
> `release-backend.yml` (ver nota no topo deste documento — quebrava o workflow,
> causa não encontrada). Até ser reativado, migrations de produção rodam na mão:
> `DATABASE_URL="<url-de-produção>" npx prisma migrate deploy` de uma máquina com
> o repo clonado. O design abaixo é o que **deveria** acontecer automaticamente
> quando o job voltar.

Comando: `prisma migrate deploy` (nunca `migrate dev` — não gera migration nova,
não pede confirmação interativa, só aplica o que já está commitado em
`prisma/migrations/`). Mesmo comando já usado em
`scripts/docker-entrypoint.dev.sh` pro ambiente de dev via Docker Compose.

Em produção, a migration deveria rodar como um **job separado do pipeline**
(`migrate` em `release-backend.yml`) — não dentro do container da aplicação.
Motivos:

- Evita que múltiplas réplicas da imagem rodem `migrate deploy` simultaneamente na
  inicialização (condição de corrida se o host escolhido rodar mais de uma
  instância).
- A migration precisa terminar **antes** da nova versão começar a receber
  tráfego — como job dedicado antes do job `deploy`, isso é garantido pela ordem
  do pipeline (`needs: migrate`), não por sorte de qual container sobe primeiro.

Hoje esse job fica **parado** (`if: secrets.PRODUCTION_DATABASE_URL != ''`) porque
não existe banco de produção ainda. Quando o card "Deploy backend + banco
gerenciado" escolher o host/banco gerenciado, basta criar o secret
`PRODUCTION_DATABASE_URL` no repositório (Settings → Secrets and variables →
Actions) — o job liga sozinho, sem precisar editar o workflow.

## Rollback

Duas partes que podem precisar de rollback separadamente: a **imagem/aplicação** e
o **banco de dados**. Quase sempre só a primeira é necessária.

### Rollback da imagem/aplicação

Toda imagem fica taguada com o SHA do commit que a gerou, então voltar pra uma
versão anterior é reapontar o host de produção pra essa tag antiga — não é
preciso rebuildar nada:

```bash
# Descobrir o SHA do commit bom conhecido (ex.: o commit antes do que quebrou)
git log --oneline

# A imagem já existe no GHCR com essa tag, publicada quando aquele commit foi
# mergeado em main:
ghcr.io/killa9vv/atlas_nova_clean-main/backend:<sha-do-commit-bom>
```

O comando exato pra "reapontar" depende do host escolhido (ex.: `docker service
update --image ...` no Swarm, redeploy manual apontando a tag no dashboard do
Railway/Render/Fly.io, `kubectl set image` no Kubernetes) — **fica pra quando o
host for decidido**; o ponto fixo é que a tag da imagem antiga sempre existe no
registro, pronta pra ser reusada.

### Rollback de migration do banco

Nem toda migration do Prisma tem um "down" seguro — `prisma migrate deploy` só
aplica migrations pra frente, não existe `prisma migrate undo` de produção. Antes
de rodar rollback do banco, classifique a migration que você quer desfazer:

- **Aditiva** (nova coluna nullable, nova tabela, novo índice) — normalmente
  segura de deixar como está mesmo revertendo a aplicação pra uma versão
  anterior; o código antigo simplesmente ignora a coluna/tabela nova. **Não
  precisa reverter o banco.**
- **Destrutiva ou com perda de dado** (coluna removida, coluna com `NOT NULL`
  adicionado sem default, rename de coluna/tabela, mudança de tipo) — reverter só
  a aplicação pra uma versão anterior pode quebrar contra o schema novo (coluna
  que o código antigo espera já não existe, por exemplo). **Precisa de
  intervenção manual no banco**, escrita à mão pra aquele caso específico (não
  existe script genérico de "desfazer" — o SQL de reversão depende exatamente do
  que a migration fez). Faça backup do banco antes de qualquer alteração manual.

Recomendação prática: ao escrever uma migration que pode ser destrutiva, prefira
dividir em duas migrations/dois deploys (ex.: primeiro só adicionar a coluna nova
mantendo a antiga, deployar e validar, só depois remover a antiga numa segunda
migration) — isso torna o rollback do primeiro passo sempre seguro (é aditivo) e
reduz a janela onde uma migration destrutiva precisa ser revertida sob pressão.

## O que falta pra ativar o deploy de verdade

Estes itens dependem do card "Deploy backend + banco gerenciado" (ainda não
iniciado) — nenhum foi inventado ou decidido aqui:

1. **Host de produção** (Railway, Render, Fly.io, VPS próprio, ou outro) — decide
   o comando exato do job `deploy` em `release-backend.yml` (hoje é um placeholder
   que só imprime um aviso e a tag da imagem já publicada).
2. **Banco gerenciado de produção** — decide o valor do secret
   `PRODUCTION_DATABASE_URL` (formato `postgresql://usuario:senha@host:porta/banco`),
   que liga o job `migrate` automaticamente assim que existir.
3. **Domínio da API** — usado pelo frontend em produção
   (`NEXT_PUBLIC_API_BASE_URL`) e por `CORS_ORIGIN`/`MERCADOPAGO_NOTIFICATION_URL`
   no backend; nenhum dos três está configurado pra produção ainda (só
   `.env.example` com valores de dev).
4. **Redis gerenciado de produção** — a fila de e-mails (BullMQ) precisa de um
   Redis alcançável a partir do host escolhido; hoje só existe o serviço `redis`
   no `docker-compose.yml` de desenvolvimento.
5. **Credenciais de produção do Mercado Pago e do Resend** (e-mail) — ambos
   opcionais hoje (a API sobe sem eles, só os endpoints que dependem falham em
   runtime), mas precisam ser configurados como secrets antes do primeiro deploy
   real pra essas integrações funcionarem de verdade.

Nenhum desses cinco itens bloqueia o merge deste card — a esteira (lint → testes →
build → imagem Docker publicada) já funciona de ponta a ponta sem eles. Eles só
bloqueiam os jobs `migrate` e `deploy` de fazerem alguma coisa além de ficar
parados/avisar que ainda não foram configurados.
