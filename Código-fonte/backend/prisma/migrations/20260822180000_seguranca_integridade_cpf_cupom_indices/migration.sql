-- Lote de correções de segurança/integridade encontradas em auditoria:
-- 1. cpf sem unicidade permitia clientes duplicados por engano/fraude.
-- 2. itens_pedido não tinha índice nas FKs mais consultadas do sistema.
-- 3. cupom_codigo era texto solto, sem referência real a um Cupom existente.
-- Nenhuma linha existente é afetada (clientes/pedidos estavam vazias no momento).

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");

-- CreateIndex
CREATE INDEX "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "itens_pedido_produto_id_idx" ON "itens_pedido"("produto_id");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cupom_codigo_fkey" FOREIGN KEY ("cupom_codigo") REFERENCES "cupons"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;
