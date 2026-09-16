-- Separa pedidos.desconto (soma de atacado + cupom) em duas colunas, pelo mesmo
-- motivo que Carrinho já trata os dois separadamente (ver item-precificado.ts):
-- são descontos de origem/natureza diferentes e reporte financeiro precisa saber
-- quanto veio de cada um.
--
-- Backfill: pedidos existentes não tinham esse breakdown gravado. Atribuímos todo
-- o valor histórico a desconto_cupom porque RegraAtacado (feature de desconto por
-- atacado) é posterior à maioria dos pedidos já criados no banco — não há como
-- recuperar retroativamente qual parte, se alguma, era atacado.

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN "desconto_atacado" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "pedidos" ADD COLUMN "desconto_cupom" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "pedidos" SET "desconto_cupom" = "desconto";

ALTER TABLE "pedidos" DROP COLUMN "desconto";
