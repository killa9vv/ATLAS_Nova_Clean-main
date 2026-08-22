-- Guarda o public_id do Cloudinary junto de cada imagem, necessário pra remover o
-- asset de lá quando a imagem é excluída (a URL sozinha não é suficiente/estável
-- pra isso). Nenhuma linha existente é afetada (imagens_produto está vazia — nenhum
-- fluxo de upload existia antes desta migration).

-- AlterTable
ALTER TABLE "imagens_produto" ADD COLUMN "provider_id" TEXT NOT NULL;
