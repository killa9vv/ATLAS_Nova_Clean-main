-- Lote de organização/higiene de schema (sem mudança de comportamento de negócio):
-- 1. token_hash sem índice em refresh_tokens/tokens_recuperacao_senha — todo login,
--    refresh de sessão e recuperação de senha faz `findFirst({ where: { tokenHash } })`,
--    virando scan sequencial conforme a tabela cresce.
-- 2. itens_carrinho -> carrinhos era ON DELETE RESTRICT; LimpezaCarrinhosScheduler
--    já precisava apagar os itens manualmente antes do carrinho numa transação só
--    pra não violar essa FK. Passa a CASCADE pra isso ser garantido pelo banco.
-- 3. pedidos não tinha índice pra suportar o filtro do painel admin (status + range
--    de created_at, ordenado por created_at desc).
-- 4. regras_atacado tinha a regra "produto_id XOR categoria_id" só validada na
--    aplicação — vira CHECK constraint (mesmo espírito do índice parcial de
--    enderecos.padrao: não expressável na DSL do schema.prisma nesta versão).
-- 5. Timestamps ausentes em categorias/marcas/produto_tipos/enderecos (nenhum campo)
--    e em clientes (só created_at) — inconsistente com o resto do schema.

-- CreateIndex
CREATE INDEX "tokens_recuperacao_senha_token_hash_idx" ON "tokens_recuperacao_senha"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- DropForeignKey
ALTER TABLE "itens_carrinho" DROP CONSTRAINT "itens_carrinho_carrinho_id_fkey";

-- AddForeignKey
ALTER TABLE "itens_carrinho" ADD CONSTRAINT "itens_carrinho_carrinho_id_fkey" FOREIGN KEY ("carrinho_id") REFERENCES "carrinhos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "pedidos_status_created_at_idx" ON "pedidos"("status", "created_at");

-- CheckConstraint (produto_id XOR categoria_id)
ALTER TABLE "regras_atacado" ADD CONSTRAINT "regras_atacado_produto_xor_categoria_check"
  CHECK (num_nonnulls("produto_id", "categoria_id") = 1);

-- AlterTable
ALTER TABLE "categorias"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "marcas"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "produto_tipos"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "enderecos"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "clientes"
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
