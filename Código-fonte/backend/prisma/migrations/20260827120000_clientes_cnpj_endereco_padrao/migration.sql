-- Suporte a cliente B2B (CNPJ) e a endereço padrão por cliente.

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "cnpj" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cnpj_key" ON "clientes"("cnpj");

-- AlterTable
ALTER TABLE "enderecos" ADD COLUMN "padrao" BOOLEAN NOT NULL DEFAULT false;

-- Índice único PARCIAL (só sobre linhas com padrao = true): garante no banco que
-- nunca existam dois endereços padrão para o mesmo cliente ao mesmo tempo, mesmo
-- sob duas requisições concorrentes marcando padrão simultaneamente. Não é
-- expressável na DSL do schema.prisma nesta versão — mantido só aqui, à mão.
CREATE UNIQUE INDEX "enderecos_cliente_id_padrao_key" ON "enderecos"("cliente_id") WHERE "padrao";
