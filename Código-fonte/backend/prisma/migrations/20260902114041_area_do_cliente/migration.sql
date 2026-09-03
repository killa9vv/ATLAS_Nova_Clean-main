-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "senha_hash" TEXT;

-- CreateTable
CREATE TABLE "tokens_recuperacao_senha" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacao_senha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "revogado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_status_historico" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "status_anterior" "StatusPedido",
    "status_novo" "StatusPedido" NOT NULL,
    "alterado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_status_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tokens_recuperacao_senha_cliente_id_idx" ON "tokens_recuperacao_senha"("cliente_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_cliente_id_idx" ON "refresh_tokens"("cliente_id");

-- CreateIndex
CREATE INDEX "pedido_status_historico_pedido_id_idx" ON "pedido_status_historico"("pedido_id");

-- AddForeignKey
ALTER TABLE "tokens_recuperacao_senha" ADD CONSTRAINT "tokens_recuperacao_senha_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_status_historico" ADD CONSTRAINT "pedido_status_historico_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
