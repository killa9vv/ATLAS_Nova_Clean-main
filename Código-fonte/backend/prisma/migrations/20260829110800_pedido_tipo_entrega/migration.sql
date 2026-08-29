-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('ENTREGA', 'RETIRADA');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "endereco_bairro" TEXT,
ADD COLUMN     "endereco_cep" TEXT,
ADD COLUMN     "endereco_cidade" TEXT,
ADD COLUMN     "endereco_complemento" TEXT,
ADD COLUMN     "endereco_estado" TEXT,
ADD COLUMN     "endereco_logradouro" TEXT,
ADD COLUMN     "endereco_numero" TEXT,
ADD COLUMN     "tipo_entrega" "TipoEntrega" NOT NULL DEFAULT 'ENTREGA',
ADD COLUMN     "valor_frete" DECIMAL(10,2) NOT NULL DEFAULT 0;
