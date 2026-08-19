/*
  Warnings:

  - Added the required column `marca_id` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pack` to the `produtos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `produto_tipo_id` to the `produtos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "TipoDesconto" AS ENUM ('PERCENTUAL', 'VALOR_FIXO');

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "cliente_id" TEXT,
ADD COLUMN     "cupom_codigo" TEXT,
ADD COLUMN     "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "marca_id" TEXT NOT NULL,
ADD COLUMN     "pack" TEXT NOT NULL,
ADD COLUMN     "produto_tipo_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_tipos" (
    "id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "info_tecnica" TEXT,
    "precaucoes" TEXT,

    CONSTRAINT "produto_tipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cpf" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cupons" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo_desconto" "TipoDesconto" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "valido_ate" TIMESTAMP(3),
    "uso_maximo" INTEGER,
    "usos_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nome_key" ON "marcas"("nome");

-- CreateIndex
CREATE INDEX "produto_tipos_categoria_id_idx" ON "produto_tipos"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "produto_tipos_categoria_id_nome_key" ON "produto_tipos"("categoria_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "enderecos_cliente_id_idx" ON "enderecos"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "cupons_codigo_key" ON "cupons"("codigo");

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "produtos_produto_tipo_id_idx" ON "produtos"("produto_tipo_id");

-- CreateIndex
CREATE INDEX "produtos_marca_id_idx" ON "produtos"("marca_id");

-- AddForeignKey
ALTER TABLE "produto_tipos" ADD CONSTRAINT "produto_tipos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_produto_tipo_id_fkey" FOREIGN KEY ("produto_tipo_id") REFERENCES "produto_tipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
