-- Novo status pra pedidos feitos via checkout do WhatsApp: registrados no banco antes
-- do redirect, mas sem pagamento online iniciado (a venda fecha na conversa).

-- AlterEnum
ALTER TYPE "StatusPedido" ADD VALUE 'AGUARDANDO_CONTATO';
