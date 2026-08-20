# Atlas Nova Clean — Backend

NestJS + Prisma + PostgreSQL. Módulos: `produtos`, `carrinho`, `pedidos`, `pagamentos` (Mercado Pago).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL e as chaves do Mercado Pago
npx prisma migrate deploy   # só na primeira vez, ou quando houver migration nova
npm run dev                 # sobe o Postgres local e a API juntos (Ctrl+C encerra os dois)
```

Se preferir bancos separados (útil se você já sobe o Postgres manualmente por outro
lado), use `node scripts/dev-db.mjs keep-alive` numa aba e `npm run start:dev` em outra.

## Banco de dados

Schema em `prisma/schema.prisma`, diagrama de entidades em
[`prisma/ERD.md`](prisma/ERD.md). `npm run prisma:seed` popula o catálogo a
partir de `frontend/src/data/products.ts`.

### Ver os dados visualmente (Prisma Studio)

Não precisa de MySQL nem de instalar um cliente SQL à parte — o Prisma já vem
com uma interface web pra navegar e editar as tabelas do Postgres local:

```bash
# terminal 1 — sobe o Postgres local (se ainda não estiver rodando)
node scripts/dev-db.mjs keep-alive

# terminal 2 — abre a interface visual
npx prisma studio
```

Abre automaticamente `http://localhost:5555`. Se já rodou `npm run
prisma:seed`, o catálogo (126 produtos, marcas, categorias) já aparece
populado. `Ctrl+C` em cada terminal pra encerrar.

Se preferir um cliente SQL de verdade em vez da interface do Prisma (DBeaver,
TablePlus, pgAdmin, etc.), aponte pro mesmo Postgres local — porta e
credenciais em `DATABASE_URL` no `.env`.

## Testes

```bash
npm test
```

## Variáveis de ambiente

Ver `.env.example`.

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
