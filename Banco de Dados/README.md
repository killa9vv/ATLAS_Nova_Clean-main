# Banco de Dados

Modelagem, schema e migrations do projeto.

`schema.prisma`, `ERD.md` e `schema.dbml` nesta pasta são **cópias estáticas** (snapshot de
2026-08-26) para consulta rápida — a fonte viva, lida pela aplicação em tempo de build, é a de
dentro do código-fonte. Se mexer no schema, atualize lá, não aqui:

- [Schema Prisma](../Código-fonte/backend/prisma/schema.prisma) — definição de todas as entidades,
  relacionamentos e constraints.
- [ERD](../Código-fonte/backend/prisma/ERD.md) — diagrama entidade-relacionamento.
- [schema.dbml](../Código-fonte/backend/prisma/schema.dbml) — versão DBML do schema (visualizável em [dbdiagram.io](https://dbdiagram.io)).
- [Migrations](../Código-fonte/backend/prisma/migrations/) — histórico incremental de mudanças no banco, em ordem cronológica (não copiado aqui — são ~8 pastas com SQL gerado, consulte direto no código-fonte).
- [Seed](../Código-fonte/backend/prisma/seed.ts) — script que popula o catálogo inicial.

## Principais entidades

Produto, Categoria, Marca, Cliente, Endereço, Carrinho/ItemCarrinho, Pedido/ItemPedido, Pagamento,
Cupom, Usuário (autenticação/autorização). Detalhes de campos e relacionamentos: ver ERD acima.
