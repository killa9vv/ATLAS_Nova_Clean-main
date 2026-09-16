-- apelido em enderecos: rótulo livre opcional ("Casa", "Trabalho"), só exibição.
ALTER TABLE "enderecos" ADD COLUMN "apelido" TEXT;

-- alterado_por em pedido_status_historico: quem (admin) fez a transição manual —
-- null quando foi automática (webhook/polling de pagamento). ON DELETE SET NULL
-- porque a linha do histórico é auditoria e deve sobreviver mesmo que o usuário
-- admin que fez a mudança seja excluído depois.
ALTER TABLE "pedido_status_historico" ADD COLUMN "alterado_por" TEXT;

CREATE INDEX "pedido_status_historico_alterado_por_idx" ON "pedido_status_historico"("alterado_por");

ALTER TABLE "pedido_status_historico" ADD CONSTRAINT "pedido_status_historico_alterado_por_fkey"
  FOREIGN KEY ("alterado_por") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
