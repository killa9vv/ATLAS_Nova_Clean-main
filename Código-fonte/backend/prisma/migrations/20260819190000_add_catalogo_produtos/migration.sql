-- Necessário para remover acentos ao gerar o slug provisório de backfill abaixo
CREATE EXTENSION IF NOT EXISTS unaccent;

-- AlterTable: adiciona os campos do "Núcleo do catálogo"
ALTER TABLE "produtos" ADD COLUMN     "categoria" TEXT;
ALTER TABLE "produtos" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "produtos" ADD COLUMN     "slug" TEXT;

-- Backfill: gera um slug provisório para produtos já existentes, a partir do nome.
-- (a aplicação sempre gera o slug definitivo no momento da criação; isso aqui só
-- evita que a coluna fique NULL para linhas que já existiam antes desta migration)
UPDATE "produtos"
SET "slug" = lower(
  regexp_replace(
    regexp_replace(trim(unaccent("nome")), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || substring("id", 1, 8)
WHERE "slug" IS NULL;

-- Torna a coluna obrigatória e única, agora que todas as linhas têm valor
ALTER TABLE "produtos" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "produtos_slug_key" ON "produtos"("slug");

-- CreateIndex
CREATE INDEX "produtos_nome_idx" ON "produtos"("nome");
CREATE INDEX "produtos_categoria_idx" ON "produtos"("categoria");
