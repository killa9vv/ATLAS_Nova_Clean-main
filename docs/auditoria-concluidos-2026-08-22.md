# Auditoria da lista "✅ Concluído" — Atlas Nova Clean

**Data:** 2026-08-22
**Escopo:** 12 cards movidos de "👀 Revisão" para "✅ Concluído" em bloco, na mesma janela de tempo, sem que os checklists nas descrições tenham sido atualizados.
**Método:** leitura direta do código-fonte atual, execução real das suítes de teste (unitária e e2e, contra Postgres real via `embedded-postgres`), lint, e inspeção do histórico do Git — não a posição do card no board.

---

## ⚠️ Achado crítico #1 — nada disto está commitado no Git

Antes de qualquer avaliação item a item: **o repositório tem 99 arquivos com mudanças não commitadas**, e o último commit (`987c41f`) é anterior a todo o trabalho descrito nos 12 cards abaixo.

```
$ git log --oneline -5
987c41f fix(backend): auditoria de segurança e integridade do banco   ← último commit
4c29946 fix(backend): protege rotas de escrita com guards...
...
$ git status --short | wc -l
99   ← arquivos com mudanças não commitadas
```

Ou seja: tudo o que é confirmado como "✅" nesta auditoria **existe apenas na working tree local de uma máquina**. Se esse diretório for perdido, resetado, ou se alguém rodar `git checkout .`/`git reset --hard` sem perceber, **todo o trabalho destes 12 cards desaparece** — inclusive a correção do card de estoque, o mais crítico de todos. O board dizendo "Concluído" não reflete nenhuma garantia de persistência hoje. Isso é tratado com prioridade máxima na seção "Próximos passos".

## 🟢 Achado crítico #2 — a falha de estoque descrita no card foi corrigida

O texto original do card #9 diz: *"nenhum fluxo escreve em `Produto.estoque`... o mesmo item pode ser vendido infinitas vezes"*. **Isso está desatualizado.** Múltiplos fluxos escrevem em `Produto.estoque` hoje, com bloqueio condicional atômico, e o teste de concorrência do critério de pronto do card **passa de verdade contra Postgres real**, executado nesta auditoria:

```
$ npm run test:e2e
PASS test/pagamentos-webhook.e2e-spec.ts
  ✓ duas confirmações de pagamento concorrentes pelo último item: só uma decrementa o estoque e vira PAGO
Tests: 20 passed, 20 total
```

Detalhe importante (não é "tudo certo, sem ressalva"): o **design mudou** em relação ao que o checklist do card pede literalmente — o decremento não acontece mais "na criação do pedido" (like o card original assumia), e sim na **confirmação do pagamento**. Isso é uma decisão deliberada e documentada (ver seção do card #9 abaixo), com uma implicação real que precisa ficar registrada: dois pedidos (não pagos) podem coexistir para o último item — só a *venda* (pagamento confirmado) é que não pode dobrar. Isso não é overselling na prática, mas diverge do texto literal do card, que por isso está marcado como ⚠️ Parcial, não ✅ pleno — ver detalhamento item a item.

---

## Sumário executivo

| # | Card | Status geral | Corretamente em "Concluído"? |
|---|---|---|---|
| 1 | Layout base e navegação | ✅ Confirmado | Sim |
| 2 | Setup Next.js + Tailwind + design system | ✅ Confirmado | Sim |
| 3 | Configuração de ambientes e secrets | ⚠️ Parcial | Quase — 1 item secundário faltando |
| 4 | Categorias, marcas e upload de imagens | ⚠️ Parcial | Quase — hierarquia de categoria não implementada |
| 5 | Padrões de código e Git | ⚠️ Parcial | Quase — "git flow main/develop" substituído por trunk-based documentado |
| 6 | Módulo de pagamentos | ✅ Confirmado | Sim |
| 7 | Swagger e documentação da API | ✅ Confirmado | Sim (contraste com auditoria anterior: era 100% falso, agora é real) |
| 8 | Webhook de notificações (IPN) | ✅ Confirmado | Sim — os 3 itens pendentes foram resolvidos |
| 9 | 🔴 Controle de estoque | ⚠️ Parcial (mas a falha crítica original está corrigida) | Sim, com ressalva documentada — ver acima |
| 10 | Checkout via WhatsApp | ✅ Confirmado | Sim |
| 11 | Testes automatizados (unit + e2e) | ⚠️ Parcial | Quase — usa `embedded-postgres`, não literalmente Testcontainers |
| 12 | Prisma + migrations + seeds | ✅ Confirmado | Sim (inalterado desde a auditoria anterior) |

**Contagem:** 7 cards inteiramente prontos, 5 cards com uma ressalva pontual e não-bloqueante (nenhum reprovado). **Nenhum card foi movido para "Concluído" contendo uma falha funcional real não resolvida** — a única questão sistêmica é o achado crítico #1 (nada commitado).

---

## Card 1 — Layout base e navegação

**Status:** ✅ Confirmado. **Recomendação:** manter em Concluído.

| Item | Status | Evidência |
|---|---|---|
| Header (logo, busca, menu, carrinho) | ✅ Confirmado | `frontend/src/components/layout/Header.tsx`, `HeaderNav.tsx` |
| Menu mobile (drawer) | ✅ Confirmado | `HeaderNav.tsx` — testado no navegador em 320px, abre/fecha corretamente |
| Footer (contato, redes, institucional) | ✅ Confirmado | `frontend/src/components/layout/Footer.tsx` |
| Breadcrumbs | ✅ Confirmado | `frontend/src/components/layout/Breadcrumbs.tsx` — renderizado e testado (`Início / Limpeza / Detergente`) |
| Página 404 e página de erro | ✅ Confirmado | `frontend/src/app/not-found.tsx`, `frontend/src/app/error.tsx` — testado no navegador: rota inexistente devolve HTTP 404 e renderiza dentro do layout (header/footer presentes) |
| Responsivo 320px→desktop | ✅ Confirmado | Testado com Playwright em viewport 320px: sem scroll horizontal (`document.documentElement.scrollWidth > clientWidth` → `false`), menu mobile funcional |

---

## Card 2 — Setup Next.js + Tailwind + design system

**Status:** ✅ Confirmado. **Recomendação:** manter em Concluído.

| Item | Status | Evidência |
|---|---|---|
| App Router configurado | ✅ Confirmado | `frontend/src/app/` |
| Tailwind com tokens da marca | ✅ Confirmado | `frontend/src/app/globals.css` (`@theme` com navy/blue/sky/amber/etc.) |
| Componentes base: Button, Input, Card, Badge, Modal, Toast | ✅ Confirmado | `frontend/src/components/ui/` — todos os 6 existem, renderizados e testados no navegador (screenshots confirmam Button com 5 variações/estados, Badge com 4 cores, Input com estado de erro, Modal abrindo/fechando com Esc, Toast aparecendo) |
| Cliente HTTP centralizado com tratamento de erro | ✅ Confirmado | `frontend/src/lib/http.ts` — `ApiError`, mapeamento de erro de rede vs. resposta não-ok |
| React Query ou SWR | ✅ Confirmado | `@tanstack/react-query` instalado, `QueryProvider` conectado no `layout.tsx` |
| Skeletons e loading padronizados | ✅ Confirmado | `frontend/src/components/ui/Skeleton.tsx` (`Skeleton` + `ProductCardSkeleton`) |

`npm run build` e `npm run lint` rodados nesta auditoria: ambos limpos, sem erros.

---

## Card 3 — Configuração de ambientes e secrets

**Status:** ⚠️ Parcial. **Recomendação:** manter em Concluído — a lacuna restante é secundária e não bloqueia nada hoje.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| ConfigModule global com validação de schema (Zod/Joi) | ✅ Confirmado | `backend/src/shared/config/env-validation.schema.ts` (Joi) + `app.module.ts` — testado nesta auditoria: schema rejeita `DATABASE_URL`/`JWT_SECRET` ausentes ou mal formados, 100% de cobertura no arquivo | — |
| Separar `.env` local/staging/produção | ❌ Não encontrado | Só existe `backend/.env.example`; nenhum arquivo de referência por ambiente | Não crítico — Railway usa variáveis via dashboard, não arquivos. Se quiser o item literal, documentar isso explicitamente em vez de deixar em branco |
| Nenhuma chave commitada | ✅ Confirmado | `backend/.gitignore` ignora `.env`; `git log --all -- backend/.env` não retorna nada |
| Documentar cada variável no `.env.example` | ✅ Confirmado | `backend/.env.example` — todas as variáveis comentadas, incluindo o requisito de tamanho mínimo do `JWT_SECRET` |

---

## Card 4 — Categorias, marcas e upload de imagens

**Status:** ⚠️ Parcial. **Recomendação:** manter em Concluído — o item faltante é opcional pelo próprio texto do card ("se necessário").

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| CRUD de categorias (hierarquia pai/filho **se necessário**) | ⚠️ Parcial | `backend/src/categorias/` completo (domain/application/infrastructure, CRUD real, guard de exclusão com produto vinculado) — mas **sem hierarquia**: `schema.prisma` não tem `parentId` em `Categoria` (`grep parentId` não retorna nada) | Se hierarquia for de fato necessária pro catálogo real, precisa de nova migration + lógica de árvore. Se não for, o card está completo como está |
| CRUD de marcas | ✅ Confirmado | `backend/src/marcas/` completo, com checagem de nome duplicado e produto vinculado |
| Upload múltiplo de imagens por produto | ✅ Confirmado | `POST /produtos/:id/imagens`, testado e2e (upload, listar, definir principal, remover) |
| Storage: Cloudinary | ✅ Confirmado | `backend/src/produtos/infrastructure/cloudinary-storage.adapter.ts` |
| Validação de tipo e tamanho + thumbnail | ✅ Confirmado | `FileTypeValidator`/`MaxFileSizeValidator` (5MB, jpeg/png/webp) + thumbnail via transformação de URL do Cloudinary (`w_300,h_300,c_fill`) |
| Definir imagem principal | ✅ Confirmado | `PATCH /produtos/:id/imagens/:imagemId/principal`, testado e2e (troca de posição confirmada) |

---

## Card 5 — Padrões de código e Git (ESLint, Prettier, Husky)

**Status:** ⚠️ Parcial. **Recomendação:** manter em Concluído — divergência é uma decisão documentada, não uma lacuna.

| Item | Status | Evidência |
|---|---|---|
| ESLint + Prettier (back e front) | ✅ Confirmado | `backend/.eslintrc.js`, `frontend/eslint.config.mjs` — `npm run lint` roda limpo em ambos nesta auditoria (frontend 100% limpo; backend só acusa erros de quebra de linha CRLF do checkout local no Windows — artefato confirmado do ambiente, não do conteúdo versionado, que é LF; CI roda em Linux e não é afetado) |
| Husky + lint-staged no pre-commit | ✅ Confirmado | `.husky/pre-commit` → `npx lint-staged` |
| Commitlint com Conventional Commits | ✅ Confirmado | `.husky/commit-msg` + `commitlint.config.js` — testado nesta sessão: aceita `feat(backend): ...`, rejeita mensagem fora do padrão |
| Git flow simples: main / develop / feature/* | ⚠️ Divergente (documentado) | Não existe branch `develop`. `CONTRIBUTING.md` documenta explicitamente um fluxo trunk-based (`main` + `feature/*` via PR) como decisão deliberada, não como lacuna |
| Template de Pull Request | ✅ Confirmado | `.github/PULL_REQUEST_TEMPLATE.md` |

---

## Card 6 — Módulo de pagamentos (arquitetura desacoplada)

**Status:** ✅ Confirmado (sem alterações desde a auditoria anterior). **Recomendação:** manter em Concluído.

| Item | Status | Evidência |
|---|---|---|
| Interface `PaymentGateway` no domínio | ✅ Confirmado | `backend/src/pagamentos/domain/payment-gateway.port.ts` |
| Implementação `MercadoPagoGateway` | ✅ Confirmado | `backend/src/pagamentos/infrastructure/gateways/mercado-pago-gateway.adapter.ts` |
| Entidade Pagamento com status próprio | ✅ Confirmado | `pagamento.entity.ts` + `status-pagamento.enum.ts` |
| Criar pagamento a partir do pedido | ✅ Confirmado | `criar-pagamento.use-case.ts` |
| Consultar status de pagamento | ✅ Confirmado | `consultarPagamento()` |
| Tratar erros e timeouts do gateway | ✅ Confirmado | timeout de 10s, mapeamento de 401/403/5xx, idempotency key por chamada |

---

## Card 7 — Swagger e documentação da API

**Status:** ✅ Confirmado. **Recomendação:** manter em Concluído.

Contraste importante com a auditoria anterior: neste mesmo card, na revisão passada, **todos** os itens marcados `[x]` pelo time eram falsos (`@nestjs/swagger` nem estava instalado). Desta vez, a verificação encontrou os itens genuinamente implementados:

| Item | Status | Evidência |
|---|---|---|
| `@nestjs/swagger` em todos os controllers | ✅ Confirmado | `@ApiTags` em produtos, carrinho, pedidos, pagamentos, categorias, marcas, auth |
| Exemplos via `@ApiProperty` | ✅ Confirmado | Presente em todos os DTOs de produtos/pedidos/pagamentos (contagem: 2 a 9 ocorrências por arquivo) |
| Esquema Bearer (`addBearerAuth`, `access-token`) | ✅ Confirmado | `backend/src/main.ts:33` |
| Coleção Postman em `backend/docs/atlas-nova-clean.postman_collection.json` | ✅ Confirmado | Arquivo existe |
| Swagger UI em `/api/docs` | ✅ Confirmado | `SwaggerModule.setup('api/docs', app, swaggerDocument)` em `main.ts:36` |

---

## Card 8 — Webhook de notificações (IPN)

**Status:** ✅ Confirmado. **Recomendação:** manter em Concluído.

### Itens já marcados como feitos pelo time — reconfirmados

| Item | Status | Evidência |
|---|---|---|
| Endpoint + `ProcessarWebhookUseCase` | ✅ Confirmado | `pagamentos.controller.ts`, `processar-webhook.use-case.ts` |
| Validação de assinatura `x-signature` | ✅ Confirmado | `mercado-pago-webhook-signature.ts` |
| Mapeamento status gateway → domínio | ✅ Confirmado | `mercado-pago-status.mapper.ts` |
| Testes | ✅ Confirmado | Specs existem e passam |

### Itens que o próprio card listava como pendentes/bloqueadores — agora resolvidos

| Item | Status | Evidência |
|---|---|---|
| Janela de corrida na idempotência | ✅ Confirmado, resolvido | `PagamentoRepository.atualizarStatus` agora exige o status lido como condição do UPDATE (`processar-webhook.use-case.ts:61-66`); devolve `null` se outra notificação já mudou o status. Teste de concorrência real contra Postgres em `test/pagamentos-webhook.e2e-spec.ts`, passando nesta auditoria |
| Assinatura opcional sem `MERCADOPAGO_WEBHOOK_SECRET` | ✅ Confirmado, resolvido | `pagamentos.controller.ts:68-71` — rejeita com 401 quando `NODE_ENV=production` e o segredo não está configurado |
| Job de reconciliação para pagamentos perdidos | ✅ Confirmado | `reconciliacao-pagamentos.scheduler.ts` (`@Cron(EVERY_10_MINUTES)`) + `reconciliar-pagamentos-pendentes.use-case.ts`, reaproveitando a lógica de idempotência do webhook normal |

---

## Card 9 — 🔴 Controle de estoque (prioridade máxima desta auditoria)

**Status:** ⚠️ Parcial — **a falha crítica original (overselling) está corrigida**, mas a implementação diverge do texto literal do checklist porque o design mudou. **Recomendação:** manter em Concluído, com a ressalva abaixo registrada explicitamente na descrição do card (hoje o card não reflete a mudança de desenho).

| Item do checklist original | Status | Evidência |
|---|---|---|
| Decrementar estoque na confirmação do pagamento (webhook APROVADO) | ✅ Confirmado | `processar-webhook.use-case.ts:139-163` (`confirmarPagamento`) — decremento acontece exatamente na confirmação, não antes |
| Envolver criação de pedido + baixa de estoque em `prisma.$transaction` | ⚠️ Divergente (mas atende ao objetivo) | **Não é mais "criação de pedido + baixa" na mesma transação** — a criação do pedido (`criar-pedido.use-case.ts`) não decrementa nada. O que está em transação atômica hoje é **baixa de estoque + pedido→PAGO**, ambos no momento da confirmação (`processar-webhook.use-case.ts:141-151`, via `TransactionManager`). O objetivo do item (não deixar decremento e mudança de estado dessincronizados) é atingido, só que amarrado a um evento diferente do que o card descrevia |
| Bloqueio pessimista ou update condicional (`WHERE estoque >= quantidade`) | ✅ Confirmado | `prisma-produto.repository.ts:118-121`: `updateMany({ where: { id, estoque: { gte: quantidade } }, data: { estoque: { decrement: quantidade } } })` |
| Devolver estoque em pedido CANCELADO/ESTORNADO | ✅ Confirmado | `processar-webhook.use-case.ts:110-126` — só devolve se `estoqueHaviaSidoReservado` (ou seja, se o pedido chegou a ser PAGO); pedido cancelado antes de pagar não tinha reservado nada, corretamente não devolve nada |
| Teste cobrindo dois pedidos concorrentes do último item | ✅ Confirmado, roda de verdade | `test/pagamentos-webhook.e2e-spec.ts`, teste `'duas confirmações de pagamento concorrentes pelo último item: só uma decrementa o estoque e vira PAGO'` — dispara duas confirmações via `Promise.all`, e verifica que **exatamente uma** vira `PAGO` e o estoque final é `0` (não negativo) |

**Trecho de código central da correção** (`backend/src/produtos/infrastructure/prisma-produto.repository.ts:115-138`):

```typescript
async decrementarEstoque(itens: ItemParaDecrementarEstoque[], contexto?: unknown): Promise<void> {
  const decrementar = async (cliente: ClientePrisma) => {
    for (const item of itens) {
      const resultado = await cliente.produto.updateMany({
        where: { id: item.produtoId, estoque: { gte: item.quantidade } },
        data: { estoque: { decrement: item.quantidade } },
      });
      if (resultado.count === 0) {
        throw new EstoqueInsuficienteException(item.nome);
      }
    }
  };
  if (contexto) {
    await decrementar(contexto as Prisma.TransactionClient);
    return;
  }
  await this.prisma.$transaction((tx) => decrementar(tx));
}
```

**Resultado do teste de concorrência, executado nesta auditoria:**

```
PASS test/pagamentos-webhook.e2e-spec.ts
  ✓ duas confirmações de pagamento concorrentes pelo último item: só uma decrementa o estoque e vira PAGO
```

**Nuance que precisa estar registrada, não escondida:** com o decremento acontecendo na confirmação (não na criação), **dois pedidos podem ser criados** para o mesmo último item — só um consegue *confirmar o pagamento*. O outro fica com pagamento aprovado pelo gateway mas pedido não marcado como `PAGO`, logado como anomalia (`processar-webhook.use-case.ts:152-160`) exigindo estorno manual — não existe hoje nenhum fluxo automático de estorno. Isso não é overselling (a segunda pessoa não recebe o produto), mas é uma experiência ruim que o time deveria decidir se quer resolver (ex.: expirar pedidos não pagos após X minutos, ou reservar estoque por um tempo curto no checkout).

**Comparação com o texto original do card:** a frase "*nenhum fluxo escreve em `Produto.estoque`*" está **desatualizada** — hoje dois fluxos escrevem lá (`decrementarEstoque` e `incrementarEstoque`), ambos testados. O card deveria ser reescrito para refletir o design atual antes de continuar em Concluído, não só ter o checkbox marcado.

---

## Card 10 — Checkout via WhatsApp

**Status:** ✅ Confirmado. **Recomendação:** manter em Concluído.

| Item | Status | Evidência |
|---|---|---|
| Mensagem formatada com itens, quantidades e total | ✅ Confirmado | `atlas-nova-clean-loja/js/checkout.js` |
| Link `wa.me` pré-preenchido | ✅ Confirmado | Testado no navegador nesta sessão (URL gerada corretamente com itens e subtotal) |
| Registrar o pedido no banco antes de redirecionar | ✅ Confirmado | `checkout.js:133` — `await criarPedido(itensDoCarrinho(), 'whatsapp')` roda e é aguardado antes do `window.open` |
| Status específico `AGUARDANDO_CONTATO` | ✅ Confirmado | `schema.prisma:15` (enum `StatusPedido`), migration `20260822200000_status_pedido_aguardando_contato` |
| Botão flutuante de WhatsApp | ✅ Confirmado | `atlas-nova-clean-loja/index.html` (`.fab-whats`) |

Testado de ponta a ponta com um navegador real nesta sessão: `POST /pedidos` com `canal: "whatsapp"` retornou 201 e `status: "AGUARDANDO_CONTATO"` antes do redirect.

---

## Card 11 — Testes automatizados (unit + e2e)

**Status:** ⚠️ Parcial. **Recomendação:** manter em Concluído — divergência é de nomenclatura/ferramenta, não de cobertura.

| Item | Status | Evidência |
|---|---|---|
| Testes unitários dos casos de uso críticos (carrinho, pedido, estoque) | ✅ Confirmado | 89 testes unitários, rodados nesta auditoria (`npm run test:cov`) |
| Testes e2e do fluxo completo de compra | ✅ Confirmado | 20 testes e2e, incluindo o fluxo de webhook/confirmação de pagamento com concorrência real |
| Banco de teste isolado (Testcontainers **ou schema separado**) | ⚠️ Equivalente, não literal | Usa `embedded-postgres` (instância real e isolada por execução, sem Docker) — cumpre o objetivo do item, mas não é Testcontainers nem "schema separado" no mesmo banco |
| Cobertura mínima acordada (60% no domínio) | ✅ Confirmado | `coverageThreshold` no `package.json`, escopado a `**/domain/**/*.ts`, verificado nesta auditoria sem violação |
| Rodar testes no CI antes do merge | ✅ Confirmado | `.github/workflows/ci.yml` — `npm run test:cov` e `npm run test:e2e` em todo push/PR pra `main` |

---

## Card 12 — Prisma + migrations + seeds

**Status:** ✅ Confirmado (inalterado desde a auditoria anterior, com mais 2 migrations desde então). **Recomendação:** manter em Concluído.

| Item | Status | Evidência |
|---|---|---|
| `schema.prisma` com datasource PostgreSQL | ✅ Confirmado | — |
| Migration inicial `20260101000000_init` | ✅ Confirmado | 11 migrations no total hoje (2 novas desde a auditoria anterior: `imagem_produto_provider_id`, `status_pedido_aguardando_contato`) |
| Seed importando o catálogo do site estático | ✅ Confirmado | 163 variantes de produto no arquivo de origem |
| Scripts npm `prisma:migrate`/`deploy`/`seed`/`generate` | ✅ Confirmado | — |
| Postgres local via `embedded-postgres` | ✅ Confirmado | — |

---

## Riscos críticos

### 🔴 Nada commitado no Git

Ver "Achado crítico #1" no topo do documento. Este é o risco mais urgente hoje — mais até que qualquer lacuna de funcionalidade, porque **nenhuma das correções acima sobrevive a uma perda do working directory local**.

### 🟡 Estoque — divergência entre o checklist do card e a implementação real

Ver Card 9 acima. A falha de overselling está corrigida e testada sob concorrência real, mas:
1. O texto do card não reflete o design atual (decremento na confirmação, não na criação).
2. Pedidos concorrentes não confirmados ficam sem devolução automática de estoque via timeout/expiração — só são liberados quando alguém tenta pagar e falha.
3. Quando o decremento falha após o gateway já ter aprovado o pagamento, a única ação é um log de erro pedindo reconciliação manual — não existe estorno automático.

### 🟡 Webhook — sem fluxo automático de estorno para a anomalia de estoque

Consequência direta do ponto acima: quando `confirmarPagamento` falha por falta de estoque (`processar-webhook.use-case.ts:152-160`), o cliente já foi cobrado e não há reembolso automático. Isso é aceitável para o estágio atual do projeto (documentado, logado, não escondido), mas é uma lacuna operacional real antes de produção de verdade.

---

## Próximos passos (priorizados)

1. **Commitar todo o trabalho desta sessão imediatamente.** É o único item desta lista que é puramente urgência de processo, não qualidade de código — 99 arquivos alterados sem nenhum commit é o maior risco real hoje.
2. **Atualizar o texto do card "Controle de estoque"** pra refletir o design atual (decremento na confirmação do pagamento, não na criação do pedido) — hoje o card ainda descreve um desenho que não é mais o implementado, o que vai confundir a próxima pessoa que ler.
3. **Decidir o que fazer com pedidos concorrentes não confirmados** pelo último item — hoje ficam "pendurados" sem expiração automática nem devolução de estoque até alguém tentar pagar.
4. **Decidir se vale implementar estorno automático** para o caso em que o pagamento é aprovado mas o estoque já não existe mais (hoje é 100% manual).
5. **Hierarquia de categorias** — decidir se é necessária pro catálogo real; se sim, vira uma migration + trabalho de aplicação.
6. Itens não-bloqueantes: documentar a ausência de branch `develop` como decisão (já feito no `CONTRIBUTING.md`, só falta atualizar a descrição do card #5 pra não parecer pendência), e considerar arquivos `.env` por ambiente se o time achar que agrega valor além do que o dashboard do Railway já cobre.
