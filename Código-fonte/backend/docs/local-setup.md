# Ambiente local com Docker Compose

Alternativa ao `npm run dev` (que sobe um Postgres embarcado sem Docker — ver
[README.md](../README.md#rodando-localmente)). Use esta se preferir isolar o Postgres
num container, ou se quiser rodar `api` também containerizada. **As duas opções usam
as mesmas credenciais e a mesma porta (5433)** — não rode as duas ao mesmo tempo.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando (WSL2 backend no Windows).
- Nada de Node/Postgres instalado localmente é necessário nesta opção — tudo roda em container.

## Passo a passo (do zero)

```bash
cd Código-fonte/backend
cp .env.example .env
docker compose up --build
```

Isso sobe dois containers:

- `atlas-postgres`: Postgres 16, dados persistidos no volume `atlas_postgres_data`.
- `atlas-api`: espera o Postgres ficar saudável (`pg_isready`), aplica as migrations
  (`prisma migrate deploy`) e sobe a API com `nest start --watch` — o entrypoint faz
  isso automaticamente toda vez que o container inicia, então não há passo manual
  além dos dois comandos acima.

A API fica em `http://localhost:3000` (Swagger em `/api/docs`). Editar qualquer
arquivo em `src/` recarrega a API automaticamente (bind mount + watch).

Pra popular o catálogo de produtos na primeira vez (opcional):

```bash
docker compose exec api npx prisma db seed
```

Pra derrubar (mantendo os dados do banco):

```bash
docker compose down
```

Pra derrubar E apagar os dados (banco e node_modules do container):

```bash
docker compose down -v
```

## Se você alterar dependências (package.json)

O `node_modules` do container vive num volume nomeado (não é reconstruído a cada
`up`, só na criação do volume). Depois de mudar dependências:

```bash
docker compose exec api npm install
# ou, pra recriar tudo do zero:
docker compose down -v && docker compose up --build
```

## Acessando o Postgres de fora do container

Com `docker compose up` rodando, o Postgres fica exposto em `localhost:5433` (porta
do host — configurável via `POSTGRES_PORT` no `.env`). A connection string é a mesma
que já está em `DATABASE_URL` no `.env`:

```
postgresql://atlas:atlas@localhost:5433/atlas_nova_clean?schema=public
```

### DBeaver (o time já usa)

Nova conexão → PostgreSQL:

| Campo    | Valor              |
| -------- | ------------------ |
| Host     | `localhost`        |
| Port     | `5433`             |
| Database | `atlas_nova_clean` |
| Username | `atlas`            |
| Password | `atlas`            |

(Valores batem com `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`/`POSTGRES_PORT`
do `.env` — se você mudou algum, ajuste aqui também.)

### pgAdmin (opcional, via container)

Se preferir uma UI web em vez de instalar o DBeaver, suba o serviço opcional
(perfil `tools`, não sobe com o `docker compose up` padrão):

```bash
docker compose --profile tools up --build
```

Acesse `http://localhost:5050`, faça login com `PGADMIN_EMAIL`/`PGADMIN_PASSWORD`
do `.env` (default `dev@atlas.local` / `atlas`) e registre um servidor novo com:

| Campo                | Valor                                     |
| --------------------- | ----------------------------------------- |
| Host name/address     | `postgres` (nome do serviço, não `localhost` — pgAdmin roda dentro da mesma rede Docker) |
| Port                   | `5432` (porta interna do container, não a 5433 do host) |
| Maintenance database   | `atlas_nova_clean`                        |
| Username               | `atlas`                                   |
| Password               | `atlas`                                   |

## Troubleshooting

- **Porta 5433 já em uso** (ex: você já tem `npm run dev` — Postgres embarcado —
  rodando): pare um dos dois, ou mude `POSTGRES_PORT` no `.env` pra uma porta livre
  e reinicie o `docker compose up`.
- **API reinicia em loop**: veja o log com `docker compose logs -f api` — geralmente
  é `JWT_SECRET`/`DATABASE_URL` ausente ou mal formado no `.env` (validado na subida,
  a mensagem de erro aponta a variável exata).
- **Mudei o schema do Prisma e a API não reflete**: o entrypoint roda
  `prisma generate` + `prisma migrate deploy` a cada start do container — basta
  `docker compose restart api`.
