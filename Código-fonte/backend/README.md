# Atlas Nova Clean — Backend

NestJS + Prisma + PostgreSQL. Módulos: `auth`, `produtos` (inclui imagens), `categorias`, `marcas`,
`carrinho`, `pedidos`, `pagamentos` (Mercado Pago, com job de reconciliação), `clientes` (endereços),
`frete`, `cupons`, `banners`, `resenhas`.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e as chaves do Mercado Pago
npx prisma migrate deploy   # só na primeira vez, ou quando houver migration nova
npx prisma db seed         # só na primeira vez — popula o catálogo (~126 produtos)
npm run dev                 # sobe o Postgres local e a API juntos (Ctrl+C encerra os dois)
```

Se preferir bancos separados (útil se você já sobe o Postgres manualmente por outro
lado), use `node scripts/dev-db.mjs keep-alive` numa aba e `npm run start:dev` em outra.

## Documentação da API

Com o servidor rodando, o Swagger UI fica em `http://localhost:3000/api/docs`. Uma coleção
Postman equivalente está em [`docs/atlas-nova-clean.postman_collection.json`](docs/atlas-nova-clean.postman_collection.json).
Rotas protegidas usam o esquema Bearer (`access-token`) — gere um token em `POST /auth/login`.

## Testes

```bash
npm test           # unitários
npm run test:e2e   # e2e, sobe um Postgres embarcado dedicado (porta 5434)
```

CI (GitHub Actions, [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) roda lint,
typecheck e as duas suítes acima em todo push/PR pra `main`.

## Variáveis de ambiente

Ver `.env.example`.

## Fluxo de teste do Mercado Pago (sandbox)

Testar o Payment Brick ponta a ponta (Pix e cartão) sem envolver dinheiro real. Além do
backend rodando (seção acima), precisa de:
- O frontend rodando (`npm run dev` em `Código-fonte/frontend`) — o checkout com o
  Payment Brick fica em `/checkout`.
- [ngrok](https://ngrok.com/download) instalado e autenticado (`ngrok config add-authtoken SEU_TOKEN`,
  token grátis em ngrok.com) — só é necessário pra testar **Pix**, ver o motivo no passo 5.

1. **Credenciais TEST-**. No DevCenter (painel do Mercado Pago), dentro da sua
   aplicação → "Contas de teste", crie duas: uma pra vender (dona da
   aplicação, fornece as credenciais) e outra só pra comprar. Nunca misture
   credenciais de contas de teste diferentes — dá o erro `Unauthorized use of
   live credentials`. As credenciais da conta vendedora vão em:
   - `MERCADOPAGO_ACCESS_TOKEN` no `.env` do backend (token `TEST-...`).
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` no `.env.local` do frontend
     (`Código-fonte/frontend`).
2. **Expor o webhook com ngrok**. O Mercado Pago só notifica uma URL pública
   HTTPS — `localhost` não funciona.
   ```bash
   ngrok http 3000
   ```
   Copie a URL `https://xxxx.ngrok-free.app` que aparece, monte
   `MERCADOPAGO_NOTIFICATION_URL=https://xxxx.ngrok-free.app/pagamentos/webhook`
   no `.env` e reinicie `npm run start:dev` (o valor só é lido na subida da
   aplicação). Como o endereço muda a cada `ngrok http` no plano gratuito,
   repita esse passo sempre que reiniciar o túnel.
3. **Segredo do webhook**. No DevCenter, aba "Webhooks" da aplicação,
   cadastre a URL do passo anterior — o Mercado Pago mostra um segredo de
   assinatura na hora de salvar. Copie pra `MERCADOPAGO_WEBHOOK_SECRET`. Sem
   isso, a validação de assinatura fica desligada em desenvolvimento (só
   loga um aviso); em produção (`NODE_ENV=production`) o webhook rejeita a
   requisição.
4. **Pagar como o comprador de teste**. Abra a loja, feche um pedido e, na
   tela de pagamento, entre com o e-mail/senha da conta de teste compradora
   quando o Brick pedir — ela tem saldo fictício. Para cartão, os "cartões de
   teste" ficam na própria página da aplicação no DevCenter (têm campo próprio
   pra isso, já que os números mudam periodicamente); o **nome do titular**
   escolhido no formulário é o que decide o resultado (aprovado, recusado,
   pendente, etc.) — vale conferir a lista de nomes na mesma página antes de
   testar.
5. **Cartão confirma na hora — Pix depende do webhook.** O Mercado Pago resolve
   pagamento de cartão de forma síncrona: assim que o Brick chama `POST /pagamentos`,
   o pedido já vira `PAGO` e o estoque já é baixado, sem precisar do ngrok. Pix nasce
   `PENDENTE`; só vira `PAGO` quando a notificação assíncrona chega em
   `POST /pagamentos/webhook` (dá pra acompanhar pelo log do `npm run dev`), por isso
   só ele depende do túnel estar de pé e do `MERCADOPAGO_NOTIFICATION_URL` correto.
   Pra conferir o status sem precisar de login, use `GET /pedidos/:id/status`
   (endpoint público, é o que a própria loja consulta).

### Problemas comuns

- **Catálogo vazio / "Produto X não encontrado"**: o seed não rodou nesse banco —
  `npx prisma db seed`.
- **`pre-existing shared memory block is still in use`** ao rodar `npm run dev`: sobrou
  um processo do Postgres embarcado de uma execução anterior que não fechou direito.
  Descubra o PID na porta 5433 e finalize:
  ```powershell
  Get-NetTCPConnection -LocalPort 5433 | Select-Object OwningProcess
  Stop-Process -Id <PID> -Force
  ```
- **PowerShell recusa rodar `npm` (`não pode ser carregado porque a execução de
  scripts foi desabilitada`)**: ajuste a política de execução do seu usuário (não
  precisa de admin) — `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## Criando um módulo novo

Cada módulo mora em `src/<nome>/` com três subpastas — a dependência sempre aponta pra dentro
(infrastructure → application → domain, nunca o contrário):

```
src/<nome>/
├── domain/            # entidades, exceções, e a interface do repositório (abstract class)
│   ├── <nome>.entity.ts
│   ├── <nome>.repository.ts     # abstract class — a porta, sem Prisma/HTTP aqui dentro
│   └── <nome>.exceptions.ts     # extends DomainException
├── application/       # um use case por arquivo, orquestra o domínio
│   ├── criar-<nome>.use-case.ts
│   └── <nome>.use-case.spec.ts  # um spec só, cobrindo todos os use cases do módulo
└── infrastructure/
    ├── prisma-<nome>.repository.ts   # implementa a abstract class do domain/
    ├── <nome>.controller.ts
    ├── <nome>.module.ts
    └── dto/
        ├── criar-<nome>.dto.ts       # @ApiProperty + class-validator
        └── <nome>-response.dto.ts    # tem um fromDomain(entidade) estático
```

`src/categorias/` é o exemplo mais simples e completo pra copiar (CRUD com uma checagem de
integridade referencial antes de excluir). Passo a passo:

1. **`domain/`** primeiro: entidade (classe simples, sem decorators), a abstract class do
   repositório (só a interface — os métodos que a aplicação precisa, não o que o Prisma oferece),
   e as exceções (`extends DomainException`, com um `code` em `SCREAMING_SNAKE_CASE`).
2. Registre cada `code` novo em
   [`shared/exceptions/domain-exception.filter.ts`](src/shared/exceptions/domain-exception.filter.ts)
   — é ali que o código de domínio vira status HTTP. Esquecer esse passo faz a exceção cair no
   `500` genérico.
3. **`application/`**: um use case por operação, injetando só a abstract class do repositório
   (nunca `PrismaService` direto). Teste com o repositório mockado — ver qualquer
   `*.use-case.spec.ts` existente pro padrão de mock.
4. **`infrastructure/`**: implemente o repositório com Prisma, os DTOs (sempre com
   `@ApiProperty`/`@ApiPropertyOptional` do `@nestjs/swagger` — é o que alimenta o `/api/docs`),
   o controller (rotas de escrita atrás de `@UseGuards(JwtAuthGuard, RolesGuard)` +
   `@Roles(PapelUsuario.ADMIN)` + `@ApiBearerAuth('access-token')`), e o module (
   `{ provide: XRepository, useClass: PrismaXRepository }`).
5. Registre o module novo em [`src/app.module.ts`](src/app.module.ts).
6. Se o módulo mexe em algo que outro teste e2e já cobre indiretamente (estoque, pagamento),
   considere um teste e2e dedicado em `test/` — ver `test/categorias-marcas.e2e-spec.ts` pro
   padrão de gerar um token ADMIN via `JwtService` direto do módulo compilado.

**Convenções deliberadas, não esquecimento:**
- **Imports são relativos** (`../domain/x`), sem path aliases (`@domain`, etc.). Já foi tentado
  com `baseUrl` no `tsconfig.json` e quebrou o build — removido de propósito (ver histórico do
  Git). Não reintroduzir sem resolver isso primeiro.
- **Sem barrel files** (`index.ts` reexportando tudo do módulo) — cada arquivo é importado pelo
  caminho completo.
- Toda escrita em `Produto.estoque` passa pelo `TransactionManager`
  ([`shared/prisma/transaction-manager.ts`](src/shared/prisma/transaction-manager.ts)) quando
  precisa ser atômica junto de outra escrita — ver `ProcessarWebhookUseCase.confirmarPagamento`
  pro padrão.
- Cobertura de testes tem piso de 60% (statements/lines) pra todo arquivo em `domain/` — configurado
  em `coverageThreshold` no `package.json`, verificado via `npm run test:cov` (é o que o CI roda).
  `application/` e `infrastructure/` não têm piso formal ainda, mas normalmente ficam bem cobertos
  pela combinação de unit + e2e.

## Checklist pra produção (Mercado Pago)

1. Verificar identidade da conta Mercado Pago (CPF/CNPJ).
2. Cadastrar chave Pix ou dados bancários pra receber os pagamentos.
3. Ativar e usar as credenciais de **produção** da conta real (não as de conta
   de teste) — `MERCADOPAGO_ACCESS_TOKEN` no backend e
   `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` no `.env.local` do frontend.
4. Hospedar o backend com HTTPS público (obrigatório pro webhook funcionar).
5. Se o Mercado Pago pedir homologação da integração, o próprio painel avisa
   ao tentar ativar as credenciais de produção — com o Payment Brick (já
   integrado) a chance de precisar desse passo é menor, já que a coleta de
   dados de cartão acontece dentro do iframe deles, não no nosso código.
