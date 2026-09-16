-- ativo em categorias/marcas: soft delete lógico, mesmo padrão já usado em Produto.
-- Default true não muda nada do que já existe hoje.
ALTER TABLE "categorias" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "marcas" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- aprovado em resenhas: default true também não muda nada agora — só prepara o
-- schema pra um painel de moderação futuro (nenhum use case lê/escreve esse campo
-- ainda, igual MovimentacaoEstoque/ProdutoTipo.infoTecnica).
ALTER TABLE "resenhas" ADD COLUMN "aprovado" BOOLEAN NOT NULL DEFAULT true;
