# Auditoria da lista "👀 Revisão" — Atlas Nova Clean

**Data:** 2026-08-22
**Escopo:** os 15 cards da lista "Revisão" do board Trello, confrontados com o código-fonte real do repositório (commit `987c41f` em `main`).
**Método:** leitura direta de controllers, use cases, entities, schema Prisma, testes, configs e infraestrutura. Nenhum checkbox `[x]` marcado pelo time foi aceito sem confirmação independente no código.

---

## Sumário executivo

| # | Card | Status geral | Pronto pra "Concluído"? |
|---|---|---|---|
| 1 | Layout base e navegação | ⚠️ Parcial | Não |
| 2 | Setup Next.js + Tailwind + design system | ⚠️ Parcial | Não |
| 3 | Categorias, marcas e upload de imagens | ❌ Não iniciado | Não — volta pra "A Fazer" |
| 4 | Padrões de código e Git | ⚠️ Parcial | Não |
| 5 | Testes automatizados (unit + e2e) | ⚠️ Parcial | Não |
| 6 | Swagger e documentação da API | ❌ **Reivindicação falsa** | Não — volta pra "A Fazer" |
| 7 | Controle de estoque 🔴 | ⚠️ Parcial (melhor do que o README sugere, mas incompleto) | Não |
| 8 | Webhook de notificações (IPN) | ⚠️ Parcial (1 dos 2 riscos do time já foi corrigido) | Não |
| 9 | Configuração de ambientes e secrets | ⚠️ Parcial | Não |
| 10 | Módulo Carrinho | ❌ Não iniciado (só um cálculo stateless existe) | Não — volta pra "A Fazer" |
| 11 | Módulo Pedidos + máquina de estados | ⚠️ Parcial | Não |
| 12 | Checkout via WhatsApp | ⚠️ Parcial | Não |
| 13 | Prisma + migrations + seeds | ✅ Confirmado | **Sim** |
| 14 | Módulo de pagamentos (arquitetura desacoplada) | ✅ Confirmado | **Sim** |
| 15 | Estrutura base do projeto (Clean Architecture) | ⚠️ Parcial | Não |

**Contagem:** 2 prontos · 11 parciais · 2 não iniciados/falsos.

**Achado mais importante:** o card 6 (Swagger) foi marcado `[x]` em todos os itens pelo time, mas **nenhum dos itens existe no código** — `@nestjs/swagger` nem está instalado. É a maior discrepância entre o que o board diz e o que o repositório contém.

**Segundo achado importante:** o `README.md` raiz documenta em "Limitações conhecidas" que "o estoque não é decrementado" e que não há transações — isso está **desatualizado**. O commit `62d771f` ("restaura estoque atômico") já implementou decremento condicional com `$transaction`. O README precisa ser atualizado, mas a lacuna real (decremento não acontece na confirmação do pagamento, e sim na criação do pedido) permanece.

---

## Card 1 — Layout base e navegação

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão / voltar itens específicos pra "A Fazer".

O código relevante fica em `Código-fonte/frontend/` (Next.js), não em `Código-fonte/atlas-nova-clean-loja/` (a vitrine estática antiga).

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Header com logo, busca, categorias, carrinho | ✅ Confirmado | [`Código-fonte/frontend/src/components/layout/Header.tsx`](../Código-fonte/frontend/src/components/layout/Header.tsx), [`HeaderNav.tsx`](../Código-fonte/frontend/src/components/layout/HeaderNav.tsx) — logo+link (L14-26), busca (L44-59), `MegaMenu` de categorias, `CartButton` | — |
| Menu mobile (drawer) | ✅ Confirmado | `HeaderNav.tsx` L11-83 — estado `mobileOpen`, botão hambúrguer animado, `nav` com `max-h-0` → `max-h-[70vh]` | — |
| Footer com contato, redes sociais, institucional | ✅ Confirmado | [`Footer.tsx`](../Código-fonte/frontend/src/components/layout/Footer.tsx) L37-167 — endereço, Instagram/Facebook/WhatsApp, categorias, atendimento, políticas | — |
| Breadcrumbs | ❌ Não encontrado | Nenhuma ocorrência de "breadcrumb" em `Código-fonte/frontend/src` | Criar componente de breadcrumb e integrá-lo às páginas de categoria/produto (que ainda nem existem) |
| Página 404 e página de erro | ❌ Não encontrado | Nenhum `not-found.tsx` ou `error.tsx` em `Código-fonte/frontend/src/app` | Criar `app/not-found.tsx` e `app/error.tsx` |
| Responsivo 320px→desktop | ⚠️ Não verificável só por leitura | `globals.css` define um breakpoint customizado `--breakpoint-nav: 861px` (não o `md` padrão) e usa classes fluidas, mas não há teste automatizado nem evidência de verificação em 320px | Testar visualmente em viewport de 320px; considerar um teste de regressão visual |

**Observação:** `Código-fonte/frontend/src/app/page.tsx` L17-19 diz explicitamente que a página atual é "página de auto-teste do design system... não é um rascunho da Home. Quem pegar o cartão 'Home / vitrine' substitui este arquivo inteiro." Ou seja, **não existe Home real ainda** — isso não estava no checklist do card 1, mas é relevante para o card 2 e para qualquer expectativa de "layout pronto".

---

## Card 2 — Setup Next.js + Tailwind + design system

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| App Router configurado | ✅ Confirmado | `Código-fonte/frontend/src/app/layout.tsx`, `page.tsx` — estrutura App Router padrão do Next 16 | — |
| Tailwind com tokens da marca | ✅ Confirmado | [`Código-fonte/frontend/src/app/globals.css`](../Código-fonte/frontend/src/app/globals.css) L7-43 — cores (`--color-navy`, `--color-blue`...), fontes, radius, sombras, breakpoint customizado, tudo comentado como "portado de atlas-nova-clean-loja/css/styles.css" | — |
| Componentes base: Button, Input, Card, Badge, Modal, Toast | ❌ Não encontrado | Busca por `Button`, `Modal`, `Toast`, `Badge`, `Input` fora de `components/layout` não retornou nada | Criar biblioteca de componentes base — hoje só existem componentes de layout (Header/Footer/MegaMenu/CartButton/Ticker) |
| Cliente HTTP centralizado com tratamento de erro | ❌ Não encontrado | Nenhum arquivo `lib/http`, `lib/api`, `client.ts` etc. em `Código-fonte/frontend/src` | Criar wrapper de fetch/axios centralizado |
| React Query ou SWR | ❌ Não encontrado | `Código-fonte/frontend/package.json` não lista `@tanstack/react-query` nem `swr` entre as dependências | Adicionar e configurar a lib escolhida |
| Skeletons e loading padronizados | ❌ Não encontrado | Nenhum arquivo/skeleton encontrado | Criar componentes de loading state |

**Nota:** o `package.json` do frontend é essencialmente o boilerplate do `create-next-app` (README do frontend também é o padrão gerado, não customizado) com apenas Tailwind v4 e as libs de layout acima adicionadas.

---

## Card 3 — Categorias, marcas e upload de imagens

**Status:** ❌ Não iniciado. **Recomendação:** mover de volta para "A Fazer" — o card descreve funcionalidade de API que não existe, só modelagem de banco.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| CRUD de categorias (hierarquia pai/filho) | ❌ Não encontrado | `model Categoria` em [`schema.prisma`](../Código-fonte/backend/prisma/schema.prisma) L49-58 não tem `parentId`/auto-relação; nenhum `CategoriaController` ou `CategoriasModule` existe em `Código-fonte/backend/src` | Criar módulo `categorias` completo (domain/application/infrastructure) com hierarquia se necessário |
| CRUD de marcas | ❌ Não encontrado | `model Marca` existe (L60-67) mas nenhum `MarcaController`/`MarcasModule` | Criar módulo `marcas` completo |
| Upload múltiplo de imagens por produto | ❌ Não encontrado | `model ImagemProduto` existe (L128-138: `url`, `ordem`) mas nenhuma rota de upload, nenhum `multer`/`FileInterceptor` no backend | Criar endpoint de upload multipart |
| Storage Cloudinary ou S3/R2 | ❌ Não encontrado | Busca por `cloudinary`, `s3`, `multer` em `Código-fonte/backend/src` não retornou nada | Escolher provedor e implementar adapter na infraestrutura |
| Validação de tipo/tamanho + thumbnail | ❌ Não encontrado | — | Depende do item de upload acima |
| Definir imagem principal | ❌ Não encontrado | `ImagemProduto.ordem` existe mas não há endpoint nem flag explícita `principal`/`isMain` | Adicionar campo e endpoint para marcar imagem principal |

O único código relacionado é o `produtos.controller.ts` (CRUD de produto em si, com guards de admin — ok) e o `seed.ts`, que só grava `Categoria`/`Marca` via `upsert` durante a importação do catálogo estático, sem expor nenhuma rota HTTP para gerenciá-los.

---

## Card 4 — Padrões de código e Git (ESLint, Prettier, Husky)

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| ESLint + Prettier (back e front) | ✅ Confirmado | `Código-fonte/backend/.eslintrc.js`, `Código-fonte/frontend/eslint.config.mjs`, `.prettierrc.json`/`.prettierignore` na raiz | — |
| Husky + lint-staged no pre-commit | ✅ Confirmado | [`.husky/pre-commit`](../.husky/pre-commit) roda `npx lint-staged`; `package.json` raiz configura `lint-staged` pra `Código-fonte/backend/**/*.ts`, `Código-fonte/frontend/**/*.{ts,tsx}` e `Código-fonte/atlas-nova-clean-loja/**/*.{js,css,html}` | — |
| Commitlint com Conventional Commits | ❌ Não encontrado | Nenhum `commitlint.config.*` no repo, nenhum hook `commit-msg` em `.husky/` (só existe `pre-commit`) | Adicionar `@commitlint/cli` + `@commitlint/config-conventional` e hook `commit-msg`. Hoje as mensagens *seguem* o padrão convencional (`fix(backend): ...`, `feat(auth): ...`) por disciplina manual, não por enforcement automatizado |
| Git flow simples (main/develop/feature/*) | ⚠️ Parcial | `git branch -a` só mostra `main` localmente; o histórico mostra que branches `feature/*` foram usadas via PR (`feature/auth-jwt-roles`, commit `56efa8c`), mas **não existe branch `develop`** | Decidir se o fluxo com `develop` é realmente necessário, ou documentar o fluxo real (trunk-based com feature branches + PR direto pra `main`) |
| Template de Pull Request | ❌ Não encontrado | Nenhum arquivo `PULL_REQUEST_TEMPLATE.md` em `.github/` (a pasta `.github` nem existe) | Criar `.github/PULL_REQUEST_TEMPLATE.md` |

---

## Card 5 — Testes automatizados (unit + e2e)

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Unit tests de casos de uso críticos (carrinho, pedido, estoque) | ✅ Confirmado | `montar-carrinho.use-case.spec.ts`, `criar-pedido.use-case.spec.ts`, `prisma-produto.repository.spec.ts` (decremento de estoque), `produtos.use-case.spec.ts` | — |
| E2e do fluxo completo de compra | ⚠️ Parcial | [`Código-fonte/backend/test/pedidos.e2e-spec.ts`](../Código-fonte/backend/test/pedidos.e2e-spec.ts) cobre criação de pedido + decremento + concorrência contra Postgres real. **Não existe e2e para o fluxo de pagamento** (criação de pagamento Pix/cartão → webhook → pedido PAGO) — os testes de `pagamentos` (`pagamentos.controller.spec.ts`, `mercado-pago-gateway.adapter.spec.ts`, `processar-webhook.use-case.spec.ts`) são todos unitários com mocks, não e2e | Criar um e2e que exercite `POST /pagamentos` + `POST /pagamentos/webhook` contra o Postgres real do `test/` |
| Banco de teste isolado | ✅ Confirmado (variante) | `test/setup/global-setup.ts` + `test/setup/global-teardown.ts` sobem um Postgres via `embedded-postgres` (não é Testcontainers, mas cumpre o mesmo objetivo — instância real e isolada, sem exigir Docker) | — |
| Cobertura mínima acordada | ❌ Não encontrado | Bloco `"jest"` em `Código-fonte/backend/package.json` (L69-85) não tem `coverageThreshold` | Definir e configurar um piso de cobertura |
| Rodar testes no CI antes do merge | ❌ Não encontrado | Pasta `.github/workflows` não existe no repositório | Criar workflow de CI (GitHub Actions) rodando `npm test` a cada PR |

---

## Card 6 — Swagger e documentação da API 🔴 reivindicação falsa

**Status:** ❌ Nenhum item confirmado. **Recomendação:** mover de volta para "A Fazer" — os checkboxes `[x]` do time não correspondem ao código.

| Item marcado `[x]` pelo time | Status real | Evidência |
|---|---|---|
| `@nestjs/swagger` em todos os controllers | ❌ Não encontrado | `@nestjs/swagger` **não está nem em `Código-fonte/backend/package.json`** como dependência |
| Exemplos de request/response via `@ApiProperty` | ❌ Não encontrado | Nenhuma ocorrência de `ApiProperty` em `Código-fonte/backend/src` (busca em todos os DTOs) |
| Esquema Bearer no Swagger UI (`addBearerAuth`) | ❌ Não encontrado | Nenhuma ocorrência de `addBearerAuth`/`DocumentBuilder` no código |
| Coleção Postman em `Código-fonte/backend/docs/atlas-nova-clean.postman_collection.json` | ❌ Não encontrado | O arquivo não existe; a pasta `Código-fonte/backend/docs/` não existe |
| Swagger UI em `/api/docs` | ❌ Não encontrado | [`Código-fonte/backend/src/main.ts`](../Código-fonte/backend/src/main.ts) não chama `SwaggerModule.setup` em nenhum lugar — o bootstrap só configura CORS, `ValidationPipe` e o filtro de exceções |

**Conclusão:** este card precisa ser implementado do zero. Nada do que está descrito existe no repositório atual.

---

## Card 7 — Controle de estoque 🔴 (bloqueador crítico sinalizado pelo time)

**Status:** ⚠️ Parcial — **melhor do que o `README.md` raiz sugere, mas ainda incompleto para produção.**
**Recomendação:** manter em Revisão / não mover para Concluído.

O `README.md` raiz (L80-81) afirma: *"O estoque não é decrementado... Sem transações."* — **isso está desatualizado.** O commit `62d771f` ("fix(backend): reconcilia schema do merge quebrado e restaura estoque atômico") já implementou decremento atômico. A tabela abaixo reflete o estado real do código, não o README.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Decrementar estoque na confirmação do pagamento (webhook APROVADO) | ❌ **Não é isso que acontece** | `decrementarEstoque` é chamado em [`criar-pedido.use-case.ts:29`](../Código-fonte/backend/src/pedidos/application/criar-pedido.use-case.ts#L29) — ou seja, **na criação do pedido (checkout)**, não no webhook. Busca por "estoque" em todo `Código-fonte/backend/src/pagamentos` não retorna nenhuma ocorrência | Decidir o modelo: se o decremento na criação do pedido é intencional (reserva imediata), documentar essa decisão explicitamente — porque hoje ela diverge do que o card pede |
| Envolver criação de pedido + baixa de estoque em `prisma.$transaction` | ⚠️ Parcial | `PrismaProdutoRepository.decrementarEstoque` ([linhas 111-124](../Código-fonte/backend/src/produtos/infrastructure/prisma-produto.repository.ts#L111-L124)) roda **dentro** de um `$transaction` — mas só para os itens do próprio decremento. Em `criar-pedido.use-case.ts` L29 e L31, `decrementarEstoque(...)` e `pedidoRepository.criar(...)` são **duas chamadas separadas**, fora de uma transação em comum | Envolver as duas operações numa única `$transaction` — hoje, se `pedidoRepository.criar` falhar depois do decremento ter sido aplicado com sucesso, o estoque fica decrementado sem pedido correspondente |
| Bloqueio pessimista ou update condicional (`WHERE estoque >= quantidade`) | ✅ Confirmado | [`prisma-produto.repository.ts:114-115`](../Código-fonte/backend/src/produtos/infrastructure/prisma-produto.repository.ts#L114-L115): `updateMany({ where: { id, estoque: { gte: quantidade } }, data: { estoque: { decrement: quantidade } } })` | — |
| Devolver estoque em pedido CANCELADO/ESTORNADO | ❌ Não encontrado | Nenhuma ocorrência de `incrementarEstoque`/`devolverEstoque` em todo `Código-fonte/backend/src`; `ProcessarWebhookUseCase.reconciliarPedido` só troca `StatusPedido`, nunca toca em `Produto.estoque` | Implementar reposição de estoque quando pedido vai para `CANCELADO`/`ESTORNADO` |
| Teste cobrindo dois pedidos concorrentes do último item | ✅ **Confirmado, e é um teste forte** | [`test/pedidos.e2e-spec.ts:102-119`](../Código-fonte/backend/test/pedidos.e2e-spec.ts#L102-L119) — dispara dois `POST /pedidos` em paralelo (`Promise.all`) pro mesmo produto com `estoque: 1`, e valida `[201, 409]` e `estoque final === 0`. Roda contra Postgres real, não mock | — |

**Critério de pronto do card ("dois pedidos simultâneos — um passa, outro falha com erro de domínio") está tecnicamente satisfeito pelo teste e2e**, mas os dois itens não implementados (decremento atrelado à confirmação de pagamento, e devolução de estoque) são lacunas reais de produção: hoje, um pedido criado mas nunca pago mantém o estoque decrementado indefinidamente (nenhum mecanismo libera de volta).

---

## Card 8 — Webhook de notificações (IPN)

**Status:** ⚠️ Parcial — **um dos dois riscos apontados pelo time já foi corrigido; o outro persiste.**
**Recomendação:** manter em Revisão.

### Itens que o time já marcou como feitos — confirmados

| Item | Status | Evidência |
|---|---|---|
| Endpoint de webhook + `ProcessarWebhookUseCase` | ✅ Confirmado | [`pagamentos.controller.ts:42-79`](../Código-fonte/backend/src/pagamentos/infrastructure/pagamentos.controller.ts#L42-L79), [`processar-webhook.use-case.ts`](../Código-fonte/backend/src/pagamentos/application/processar-webhook.use-case.ts) |
| Validação de assinatura `x-signature` | ✅ Confirmado | [`mercado-pago-webhook-signature.ts`](../Código-fonte/backend/src/pagamentos/infrastructure/gateways/mercado-pago-webhook-signature.ts) — HMAC-SHA256 com `timingSafeEqual` |
| Mapeamento status gateway → domínio | ✅ Confirmado | `mercado-pago-status.mapper.ts` + `STATUS_PAGAMENTO_PARA_PEDIDO` em `processar-webhook.use-case.ts:11-17` |
| Testes de webhook e assinatura | ✅ Confirmado | `processar-webhook.use-case.spec.ts`, `mercado-pago-webhook-signature.spec.ts` — existem e passam pelos cenários de idempotência simples |

### Itens pendentes apontados pelo time

| Item | Status real | Evidência |
|---|---|---|
| Janela de corrida na idempotência | ❌ **Ainda existe, confirmado no código** | [`processar-webhook.use-case.ts:37-58`](../Código-fonte/backend/src/pagamentos/application/processar-webhook.use-case.ts#L37-L58): o use case faz **leitura** do pagamento (`buscarPorGatewayTransactionId`), **leitura** do gateway (`consultarPagamento`), compara os dois status em memória, e só então **escreve** (`atualizarStatus`). `PrismaPagamentoRepository.atualizarStatus` ([`prisma-pagamento.repository.ts:44-53`](../Código-fonte/backend/src/pagamentos/infrastructure/prisma-pagamento.repository.ts#L44-L53)) faz um `update({ where: { id } })` **sem condição no status atual** — não há `WHERE status = @statusEsperado`, nem lock, nem constraint única que impeça duas notificações concorrentes de passarem ambas pela checagem `pagamento.status === resultado.status` (ambas leem `PENDENTE`, ambas veem `APROVADO` como diferente, ambas prosseguem). O teste de "idempotência" existente (`processar-webhook.use-case.spec.ts:115-137`) só simula chamadas **sequenciais** com mocks — não prova nada sobre concorrência real, ao contrário do teste equivalente do card 7 | Adicionar `WHERE status = <status lido>` no update (optimistic concurrency) ou lock por `gatewayTransactionId`; escrever um teste de concorrência real como o de `pedidos.e2e-spec.ts` |
| Assinatura opcional / aceita sem segredo | ✅ **Já corrigido — a reivindicação do card está desatualizada** | [`pagamentos.controller.ts:63-70`](../Código-fonte/backend/src/pagamentos/infrastructure/pagamentos.controller.ts#L63-L70): se `MERCADOPAGO_WEBHOOK_SECRET` não está configurado **e** `NODE_ENV === 'production'`, o webhook agora **rejeita com 401** (`throw new UnauthorizedException(...)`). Só fora de produção é que a ausência do segredo apenas gera um `logger.warn`. Isso corresponde exatamente ao pedido do card ("deve falhar em produção") | Nenhuma — apenas atualizar o card e o `README.md` raiz (L83), que ainda descreve o comportamento antigo |
| Job de reconciliação para pagamentos perdidos | ❌ Não encontrado | Nenhuma ocorrência de `@Cron`, `ScheduleModule` ou qualquer scheduler em `Código-fonte/backend/src` | Implementar um job periódico que consulte pagamentos pendentes há muito tempo direto na API do Mercado Pago |

---

## Card 9 — Configuração de ambientes e secrets

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| ConfigModule global | ✅ Confirmado | `app.module.ts`: `ConfigModule.forRoot({ isGlobal: true })` | — |
| Validação de schema (Zod/Joi) | ❌ Não encontrado | Nenhum `Joi`/`zod` importado; a única validação de env existente é [`validar-cors-origin.ts`](../Código-fonte/backend/src/shared/config/validar-cors-origin.ts), que checa **apenas `CORS_ORIGIN`** em produção — não valida `DATABASE_URL`, `JWT_SECRET`, `MERCADOPAGO_ACCESS_TOKEN` etc. na subida da aplicação | Adicionar `validationSchema` (Joi) ou parse com Zod no `ConfigModule.forRoot` cobrindo todas as variáveis obrigatórias |
| Separar `.env` local/staging/produção | ❌ Não encontrado | Só existe `Código-fonte/backend/.env.example`; nenhum `railway.json`/`nixpacks.toml` ou `.env.staging`/`.env.production` de referência no repo | Documentar como cada ambiente (Railway) recebe suas variáveis, já que aparentemente é tudo via dashboard, não arquivo |
| Nenhuma chave commitada | ✅ Confirmado | `Código-fonte/backend/.gitignore` ignora `.env`; `git ls-files` só lista `Código-fonte/backend/.env.example`; `git log --all -- backend/.env` não retorna nenhum commit — nunca foi versionado | — |
| Documentar cada variável no `.env.example` | ✅ Confirmado | [`Código-fonte/backend/.env.example`](../Código-fonte/backend/.env.example) documenta `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN` e as 3 variáveis do Mercado Pago, com comentários detalhados sobre como obter cada uma | — |

---

## Card 10 — Módulo Carrinho

**Status:** ❌ Não iniciado como carrinho persistente. **Recomendação:** mover de volta para "A Fazer".

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Carrinho por usuário logado e por sessão anônima | ❌ Não encontrado | Modelos `Carrinho`/`ItemCarrinho` existem no `schema.prisma` (L224-253, com `sessionToken`, `clienteId` opcional) mas **nenhum repositório ou use case os utiliza** — busca por `prisma.carrinho.` em `Código-fonte/backend/src` não retorna nada | Implementar `CarrinhoRepository` + use cases de persistência |
| Adicionar/atualizar/remover item | ❌ Não encontrado | O único endpoint é `POST /carrinho/calcular` ([`carrinho.controller.ts`](../Código-fonte/backend/src/carrinho/infrastructure/carrinho.controller.ts)), que recebe a lista completa de itens a cada chamada e devolve o total recalculado — é **stateless**, não CRUD | Criar endpoints reais de add/update/remove que persistam no `Carrinho` do banco |
| Recalcular totais | ✅ Confirmado (na forma stateless) | `MontarCarrinhoUseCase` ([`montar-carrinho.use-case.ts`](../Código-fonte/backend/src/carrinho/application/montar-carrinho.use-case.ts)) recalcula preço e consolida quantidades por produto | — |
| Validar disponibilidade e preço no momento da leitura | ✅ Confirmado | `montar-carrinho.use-case.ts:34-46` — sempre busca o produto atual no banco, nunca confia em preço vindo do cliente (mesma invariante documentada no README raiz) | — |
| Merge do carrinho anônimo ao logar | ❌ Não encontrado | Não há sistema de login de cliente (só login de staff via `auth` module) nem lógica de merge | Depende primeiro de existir login de cliente |
| Expiração de carrinhos abandonados | ❌ Não encontrado | `Carrinho.expiraEm` existe no schema mas nada lê ou escreve nesse campo | Implementar job/lógica de expiração |

**Resumo:** o que existe é uma calculadora de preço/estoque sem estado, reaproveitada tanto pela pré-visualização do carrinho quanto pela criação de pedido — não um módulo de carrinho no sentido do card.

---

## Card 11 — Módulo Pedidos + máquina de estados

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Criar pedido a partir do carrinho (snapshot de preços) | ✅ Confirmado | `criar-pedido.use-case.ts` + `ItemPedido` no schema guarda `nome`/`precoUnitario` próprios, não referência viva ao produto | — |
| Numeração legível pro cliente | ❌ Não encontrado | `model Pedido` só tem `id String @id @default(uuid())` — nenhum campo de número sequencial/legível | Adicionar campo `numero` (sequencial ou formatado) |
| Estados: `AGUARDANDO_PAGAMENTO → PAGO → SEPARACAO → ENVIADO → ENTREGUE / CANCELADO` | ⚠️ Parcial | [`status-pedido.enum.ts`](../Código-fonte/backend/src/pedidos/domain/status-pedido.enum.ts) só tem `CRIADO, AGUARDANDO_PAGAMENTO, PAGO, CANCELADO, ESTORNADO` — faltam `SEPARACAO`, `ENVIADO`, `ENTREGUE` | Estender o enum e o fluxo de negócio pra pós-pagamento (logística) |
| Transições válidas centralizadas | ❌ Não encontrado | `PedidoRepository.atualizarStatus(id, status)` ([`pedido.repository.ts`](../Código-fonte/backend/src/pedidos/domain/pedido.repository.ts)) aceita qualquer status sem validar a transição; `ProcessarWebhookUseCase.reconciliarPedido` (L61-87) tem alguma proteção ad hoc (não sobrescreve status finais) mas isso não é uma máquina de estados genérica e reutilizável | Criar uma função/classe de transição de estados centralizada e usá-la em todo lugar que muda `StatusPedido` |
| Histórico de mudanças de status | ❌ Não encontrado | Nenhum modelo tipo `HistoricoStatusPedido` no schema | Criar tabela de histórico |
| Listar pedidos do cliente / listar todos no admin | ❌ Não encontrado | `pedidos.controller.ts` só tem `POST /` e `GET /:id` (este último restrito a `ADMIN`) — não existe `GET /pedidos` (lista) nem `GET /clientes/:id/pedidos` | Criar endpoints de listagem |

---

## Card 12 — Checkout via WhatsApp

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Mensagem formatada com itens, quantidades e total | ✅ Confirmado | [`Código-fonte/atlas-nova-clean-loja/js/checkout.js:106-125`](../Código-fonte/atlas-nova-clean-loja/js/checkout.js#L106-L125) — `sendWhatsappOrder()` monta a mensagem com cada item, marca, embalagem, preço e subtotal | — |
| Link `wa.me` com texto pré-preenchido | ✅ Confirmado | `checkout.js:124` — `window.open(\`https://wa.me/${STORE_WHATSAPP}?text=${msg}\`, '_blank')` | — |
| Registrar o pedido no banco antes de redirecionar | ❌ **Não acontece** | `sendWhatsappOrder()` (L106-125) **não chama `criarPedido()`** em nenhum momento — abre o link do WhatsApp diretamente a partir do carrinho em memória do navegador. `criarPedido()` só é chamado no fluxo alternativo "pagar no site" ([`checkout.js:148-151`](../Código-fonte/atlas-nova-clean-loja/js/checkout.js#L148-L151), dentro de `iniciarPagamentoNoSite`) | Chamar `criarPedido(itens)` antes de abrir o link do WhatsApp, e usar o pedido criado para registrar telefone/observações |
| Status específico `AGUARDANDO_CONTATO` | ❌ Não encontrado | `StatusPedido` enum não tem esse valor (ver card 11) | Adicionar ao enum e usá-lo no fluxo acima |
| Botão flutuante de WhatsApp | ✅ Confirmado | [`Código-fonte/atlas-nova-clean-loja/index.html:301-302`](../Código-fonte/atlas-nova-clean-loja/index.html#L301-L302) — `<a class="fab-whats" href="https://wa.me/...">` | — |

**Risco:** hoje, todo pedido feito via WhatsApp (a opção de pagamento padrão do checkout, `paymentMethod = 'whatsapp'` em `checkout.js:14`) **não deixa nenhum rastro no banco de dados** — só existe no histórico do WhatsApp da loja.

---

## Card 13 — Prisma + migrations + seeds

**Status:** ✅ Confirmado. **Recomendação:** pode ser movido para "Concluído".

| Item | Status | Evidência |
|---|---|---|
| `schema.prisma` com datasource PostgreSQL | ✅ Confirmado | `datasource db { provider = "postgresql" ... }` |
| Migration inicial `20260101000000_init` | ✅ Confirmado | `Código-fonte/backend/prisma/migrations/20260101000000_init/` existe, junto de mais 7 migrations subsequentes documentando a evolução real do schema |
| Seed importando o catálogo do site estático | ✅ Confirmado | [`Código-fonte/backend/prisma/seed.ts`](../Código-fonte/backend/prisma/seed.ts) carrega `Código-fonte/atlas-nova-clean-loja/js/data/products.js` dinamicamente (L36-44) e faz `upsert` de categoria/marca/tipo/produto para cada variante — **163 produtos** no arquivo de origem (contagem de `id:` em `products.js`), consistente com o "~163" citado no card |
| Scripts npm `prisma:migrate` / `deploy` / `seed` / `generate` | ✅ Confirmado | `Código-fonte/backend/package.json` L17-20 tem exatamente esses 4 scripts |
| Postgres local via `embedded-postgres` (dispensa Docker) | ✅ Confirmado | `Código-fonte/backend/scripts/dev.mjs` sobe Postgres + API juntos via `embedded-postgres` (dependência confirmada em `package.json:57`) |
| Enums `StatusPedido`, `StatusPagamento`, `MetodoPagamento` | ✅ Confirmado | `schema.prisma` L10-31 |

**Ressalva menor (não bloqueante):** o comentário em `mercado-pago-gateway.adapter.ts`... não, esse é de outro módulo — o comentário em `seed.ts` (linha 37) diz "~126 produtos", mas a contagem real no arquivo de dados é 163. Inconsistência de comentário, não de funcionalidade — vale corrigir o comentário.

---

## Card 14 — Módulo de pagamentos (arquitetura desacoplada)

**Status:** ✅ Confirmado. **Recomendação:** pode ser movido para "Concluído".

| Item | Status | Evidência |
|---|---|---|
| Interface `PaymentGateway` no domínio | ✅ Confirmado | [`payment-gateway.port.ts`](../Código-fonte/backend/src/pagamentos/domain/payment-gateway.port.ts) — `abstract class PaymentGateway` com `criarPagamentoPix`, `criarPagamentoCartao`, `consultarPagamento` |
| Implementação `MercadoPagoGateway` na infraestrutura | ✅ Confirmado | [`mercado-pago-gateway.adapter.ts`](../Código-fonte/backend/src/pagamentos/infrastructure/gateways/mercado-pago-gateway.adapter.ts) — `class MercadoPagoGatewayAdapter extends PaymentGateway`, fala com `api.mercadopago.com` via axios, nenhum tipo do MP vaza pro domínio |
| Entidade Pagamento com status próprio | ✅ Confirmado | `pagamento.entity.ts` + `status-pagamento.enum.ts` (`PENDENTE, EM_PROCESSAMENTO, APROVADO, RECUSADO, CANCELADO, ESTORNADO, EXPIRADO`) |
| Criar preferência/pagamento a partir do pedido | ✅ Confirmado | `criar-pagamento.use-case.ts` + `POST /pagamentos` em `pagamentos.controller.ts` |
| Consultar status de pagamento | ✅ Confirmado | `consultarPagamento()` no adapter, usado por `ProcessarWebhookUseCase` |
| Tratar erros e timeouts do gateway | ✅ Confirmado | `mercado-pago-gateway.adapter.ts:112-144` — timeout de 10s configurado no axios (L47), `traduzirErro()` distingue 401 (credenciais), 5xx/timeout (`GatewayIndisponivelException`) e recusa de negócio (`PagamentoRecusadoException`); idempotency key por chamada (L93-95) |

Este é o módulo com a implementação mais sólida e completa dos 15 cards revisados.

---

## Card 15 — Estrutura base do projeto (Clean Architecture)

**Status:** ⚠️ Parcial. **Recomendação:** manter em Revisão.

| Item | Status | Evidência | O que falta |
|---|---|---|---|
| Camadas domain/application/infrastructure | ✅ Confirmado | Consistente em todos os módulos (`auth`, `carrinho`, `pagamentos`, `pedidos`, `produtos`) | — |
| Módulos de domínio: produtos, carrinho, pedidos, clientes, pagamentos | ⚠️ Parcial | `Código-fonte/backend/src` só tem `auth/ carrinho/ pagamentos/ pedidos/ produtos/ shared/` — **não existe módulo `clientes`**, apesar de `Cliente`/`Endereco` existirem no `schema.prisma` (L170-200) | Criar módulo `clientes` (hoje pedidos são só de convidado, `Pedido.clienteId` é opcional e nada popula) |
| Barrel files e path aliases (`@domain`, `@app`, `@infra`) | ❌ Não encontrado | `Código-fonte/backend/tsconfig.json` não tem bloco `paths`; o histórico do git mostra o oposto do pedido — commit `267cb48` "remove baseUrl do tsconfig.json de vez" e `42b9d3c` "corrige tsconfig" indicam que aliases foram **removidos**, não adicionados. Nenhum arquivo `index.ts` (barrel) existe em `Código-fonte/backend/src` | Decidir se aliases fazem sentido pro projeto (dado que foram removidos deliberadamente) e, se sim, reintroduzir com cuidado |
| README com convenções do projeto | ⚠️ Parcial | O `README.md` raiz tem uma seção "Arquitetura" (L33-46) que explica a divisão em 3 camadas e as duas invariantes de negócio — é um bom começo, mas não é um guia de "como criar um módulo novo". `Código-fonte/backend/README.md` é só instruções de setup/execução, sem nenhuma menção a convenções | Expandir a seção de arquitetura com um passo a passo de criação de módulo |

**Critério de pronto do card** ("novo dev consegue criar um módulo novo só lendo o README") **não é atingido** — o README raiz explica o "porquê" da arquitetura mas não o "como" passo a passo, e não há barrel files/aliases nem exemplo de módulo documentado como referência.

---

## Riscos críticos

### 🔴 Estoque — decremento não está atrelado à confirmação de pagamento

O time já sinalizou este card como a falha mais grave do projeto. A investigação confirma que **parte do problema foi corrigida** (decremento atômico existe e tem teste de concorrência real), mas o núcleo do risco de negócio permanece: **o estoque é reservado na criação do pedido, não na confirmação do pagamento**, e **nunca é devolvido** se o pedido não for pago.

```typescript
// backend/src/pedidos/application/criar-pedido.use-case.ts (L16-32)
async executar(itensSolicitados: CarrinhoItemSolicitado[]): Promise<Pedido> {
  const carrinho = await this.montarCarrinhoUseCase.executar(itensSolicitados);
  const itens = carrinho.itens.map((item) => ({ ... }));

  // decremento acontece AQUI, na criação do pedido — antes de qualquer pagamento
  await this.produtoRepository.decrementarEstoque(itens);

  return this.pedidoRepository.criar(itens, carrinho.total); // chamada separada, sem $transaction em comum
}
```

Consequência prática: um visitante que inicia um checkout e nunca paga (ou paga e é recusado) deixa o estoque decrementado indefinidamente — não há nenhuma rotina que devolva (`grep` por `incrementarEstoque`/`devolverEstoque` em todo `Código-fonte/backend/src` não retorna nada).

**O que fazer antes de considerar o card pronto:**
1. Envolver `decrementarEstoque` + `pedidoRepository.criar` numa única `$transaction`.
2. Implementar devolução de estoque quando `ProcessarWebhookUseCase.reconciliarPedido` leva o pedido a `CANCELADO`/`ESTORNADO`.
3. Decidir e documentar se a reserva deve continuar acontecendo no checkout (com expiração) ou se deve migrar para o momento do webhook `APROVADO`.

### 🔴 Webhook — janela de corrida na idempotência ainda existe

```typescript
// backend/src/pagamentos/application/processar-webhook.use-case.ts (L36-58)
async executar(gatewayTransactionId: string): Promise<ProcessarWebhookOutput> {
  const pagamento = await this.pagamentoRepository.buscarPorGatewayTransactionId(gatewayTransactionId); // leitura
  const resultado = await this.paymentGateway.consultarPagamento(gatewayTransactionId); // leitura

  if (pagamento.status === resultado.status) {
    return { processado: false, motivo: '...' }; // checagem em memória, sem lock
  }

  const pagamentoAtualizado = await this.pagamentoRepository.atualizarStatus(
    pagamento.id, resultado.status, resultado.payloadBruto, // escrita incondicional
  );
  await this.reconciliarPedido(pagamentoAtualizado);
  ...
}
```

```typescript
// backend/src/pagamentos/infrastructure/prisma-pagamento.repository.ts (L44-53)
async atualizarStatus(id: string, status: StatusPagamento, gatewayPayload: unknown): Promise<Pagamento> {
  const pagamento = await this.prisma.pagamento.update({
    where: { id }, // <- sem condição no status atual (sem WHERE status = ...)
    data: { status: status as unknown as StatusPagamentoPrisma, gatewayPayload: ... },
  });
  return this.paraDominio(pagamento);
}
```

Duas notificações concorrentes para a mesma transação podem ambas ler `status = PENDENTE`, ambas consultar o gateway e ver `APROVADO`, e ambas passar pela checagem de idempotência (que compara valores lidos em momentos diferentes, não um lock). O teste existente (`processar-webhook.use-case.spec.ts:115-137`) só simula chamadas **sequenciais** com mocks, não concorrência real — ao contrário do teste equivalente do card de estoque, que roda duas requisições HTTP em paralelo contra um Postgres real.

**Boa notícia:** o segundo risco que o time apontou (assinatura opcional aceitando requisições sem `MERCADOPAGO_WEBHOOK_SECRET` em produção) **já foi corrigido** — `pagamentos.controller.ts:63-66` rejeita com 401 quando `NODE_ENV === 'production'` e o segredo não está configurado. O `README.md` raiz ainda descreve o comportamento antigo e deveria ser atualizado.

**O que fazer antes de considerar o card pronto:**
1. Tornar `atualizarStatus` condicional ao status esperado (`WHERE status = @statusLido`) ou usar uma constraint/lock por `gatewayTransactionId`.
2. Escrever um teste de concorrência real (dois `POST /pagamentos/webhook` em paralelo) equivalente ao de `pedidos.e2e-spec.ts`.
3. Implementar o job de reconciliação (não existe nenhum scheduler no projeto hoje).

---

## Próximos passos (priorizados)

1. **Corrigir o `README.md` raiz** — a seção "Limitações conhecidas" está desatualizada em pelo menos 2 pontos (estoque decrementa, assinatura de webhook já é obrigatória em produção) e isso está gerando informação errada tanto pro time quanto pra esta auditoria.
2. **Estoque:** unificar `decrementarEstoque` + criação de pedido numa `$transaction`; implementar devolução de estoque em pedidos cancelados/estornados.
3. **Webhook:** eliminar a janela de corrida na idempotência com update condicional/lock; escrever teste de concorrência real; implementar job de reconciliação.
4. **Swagger (card 6):** implementar do zero — nada existe hoje, apesar de todos os checkboxes marcados.
5. **Carrinho persistente (card 10):** decidir se o modelo `Carrinho`/`ItemCarrinho` do schema será usado de fato ou removido, já que hoje só existe uma calculadora stateless.
6. **Categorias/marcas/upload (card 3):** implementar os módulos de API — hoje só existe modelagem de banco.
7. **CI (card 5):** criar workflow de GitHub Actions rodando `npm test` a cada PR; definir piso de cobertura.
8. **Módulo `clientes` (card 15):** criar — hoje `Cliente`/`Endereco` existem só no schema.
9. **Máquina de estados de pedido (card 11):** centralizar transições, adicionar estados pós-pagamento (separação/envio/entrega) e numeração legível.
10. **Checkout via WhatsApp (card 12):** persistir o pedido no banco antes de redirecionar pro WhatsApp — hoje esse fluxo (o método de pagamento padrão da loja) não deixa nenhum registro no sistema.
