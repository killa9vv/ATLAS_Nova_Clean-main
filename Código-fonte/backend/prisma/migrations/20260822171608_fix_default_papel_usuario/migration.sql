-- Correção de segurança, não estrutural: o default anterior (ADMIN) fazia
-- qualquer Usuario criado sem "papel" explícito virar administrador. Não
-- afeta linhas existentes, só o comportamento de INSERTs futuros que omitirem
-- o campo.
-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "papel" SET DEFAULT 'CLIENTE';
