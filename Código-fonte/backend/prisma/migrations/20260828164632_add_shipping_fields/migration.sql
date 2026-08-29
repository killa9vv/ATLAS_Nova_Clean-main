-- AlterTable
ALTER TABLE "itens_pedido" ADD COLUMN     "frete_rateado" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "frete_total" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "altura_cm" DECIMAL(10,2),
ADD COLUMN     "comprimento_cm" DECIMAL(10,2),
ADD COLUMN     "largura_cm" DECIMAL(10,2),
ADD COLUMN     "peso_kg" DECIMAL(10,3);
