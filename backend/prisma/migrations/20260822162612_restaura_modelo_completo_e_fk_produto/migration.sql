-- DropForeignKey
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_marca_id_fkey";

-- DropForeignKey
ALTER TABLE "produtos" DROP CONSTRAINT "produtos_produto_tipo_id_fkey";

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "categoria_id" TEXT,
ALTER COLUMN "marca_id" DROP NOT NULL,
ALTER COLUMN "pack" DROP NOT NULL,
ALTER COLUMN "produto_tipo_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "produtos_categoria_id_idx" ON "produtos"("categoria_id");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_produto_tipo_id_fkey" FOREIGN KEY ("produto_tipo_id") REFERENCES "produto_tipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
