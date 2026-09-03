#!/bin/sh
# Entrypoint do serviço `api` no docker-compose.yml de dev. Roda toda vez que o
# container sobe (incluindo restart), então generate/migrate deploy são baratos e
# idempotentes de propósito — não é preciso nenhum passo manual além de `docker
# compose up` com o .env preenchido.
set -e

echo "[atlas-api] Gerando Prisma Client..."
npx prisma generate

echo "[atlas-api] Aplicando migrations pendentes..."
npx prisma migrate deploy

echo "[atlas-api] Subindo API em modo watch (hot reload)..."
exec npm run start:dev
