# Atlas Nova Clean — Backend

NestJS + Prisma + PostgreSQL. Módulos: `auth`, `produtos` (inclui imagens), `categorias`, `marcas`,
`carrinho`, `pedidos`, `pagamentos` (Mercado Pago, com job de reconciliação).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e as chaves do Mercado Pago
npx prisma migrate deploy   # só na primeira vez, ou quando houver migration nova
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
   de teste) — `MERCADOPAGO_ACCESS_TOKEN` no backend e `MERCADOPAGO_PUBLIC_KEY`
   no `js/config.js` do frontend.
4. Hospedar o backend com HTTPS público (obrigatório pro webhook funcionar).
5. Se o Mercado Pago pedir homologação da integração, o próprio painel avisa
   ao tentar ativar as credenciais de produção — com o Payment Brick (já
   integrado) a chance de precisar desse passo é menor, já que a coleta de
   dados de cartão acontece dentro do iframe deles, não no nosso código.
