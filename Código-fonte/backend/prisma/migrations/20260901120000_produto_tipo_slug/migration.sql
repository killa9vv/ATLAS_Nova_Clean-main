-- AlterTable
ALTER TABLE "produto_tipos" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "produto_tipos_slug_key" ON "produto_tipos"("slug");
