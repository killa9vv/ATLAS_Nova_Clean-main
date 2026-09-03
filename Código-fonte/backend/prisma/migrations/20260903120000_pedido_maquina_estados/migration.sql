-- Esteira de cumprimento pós-pagamento (separação/envio/entrega) — ver
-- PedidoStateMachine em src/pedidos/domain pras transições válidas.
ALTER TYPE "StatusPedido" ADD VALUE 'SEPARACAO';
ALTER TYPE "StatusPedido" ADD VALUE 'ENVIADO';
ALTER TYPE "StatusPedido" ADD VALUE 'ENTREGUE';

-- Contador atômico do número legível de pedido, um valor por ano.
CREATE TABLE "pedido_numero_sequencial" (
    "ano" INTEGER NOT NULL,
    "ultimo_valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pedido_numero_sequencial_pkey" PRIMARY KEY ("ano")
);

-- AlterTable (nullable por enquanto — backfill abaixo antes de exigir NOT NULL)
ALTER TABLE "pedidos" ADD COLUMN "numero" TEXT;

-- Backfill: gera "ANO-SEQUENCIAL" pros pedidos já existentes, sequencial por ano,
-- na ordem em que foram criados — senão a coluna não poderia virar NOT NULL/UNIQUE
-- com pedidos já existentes na tabela.
WITH numerados AS (
  SELECT
    "id",
    EXTRACT(YEAR FROM "created_at")::int AS ano,
    ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM "created_at")::int ORDER BY "created_at") AS seq
  FROM "pedidos"
)
UPDATE "pedidos" p
SET "numero" = numerados.ano || '-' || LPAD(numerados.seq::text, 6, '0')
FROM numerados
WHERE p."id" = numerados."id";

-- Inicializa o contador de cada ano já usado no backfill, pra próxima geração
-- (PrismaPedidoRepository.proximoNumero) continuar a sequência sem colidir.
INSERT INTO "pedido_numero_sequencial" ("ano", "ultimo_valor")
SELECT EXTRACT(YEAR FROM "created_at")::int, COUNT(*)::int
FROM "pedidos"
GROUP BY EXTRACT(YEAR FROM "created_at")::int
ON CONFLICT ("ano") DO UPDATE SET "ultimo_valor" = EXCLUDED."ultimo_valor";

ALTER TABLE "pedidos" ALTER COLUMN "numero" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");
