/** Snapshot mínimo da marca vinculada — só o que a vitrine precisa exibir. */
export interface MarcaDoProduto {
  id: string;
  nome: string;
  imagemUrl?: string;
}

/** Snapshot mínimo do tipo genérico vinculado — usado pra agrupar variantes do
 * mesmo produto (ex: "Detergente para Louça") e linkar pra página de detalhe. */
export interface ProdutoTipoDoProduto {
  slug: string;
  nome: string;
  /** Texto técnico/precauções padrão do tipo — ver ProdutoTipo no schema. Nem todo
   * tipo tem esse conteúdo cadastrado ainda. */
  infoTecnica?: string;
  precaucoes?: string;
}

export class Produto {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly slug: string,
    public readonly preco: number,
    public readonly estoque: number,
    public readonly ativo: boolean,
    public readonly descricao?: string,
    public readonly categoria?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly pesoKg?: number,
    public readonly alturaCm?: number,
    public readonly larguraCm?: number,
    public readonly comprimentoCm?: number,
    public readonly pack?: string,
    public readonly marca?: MarcaDoProduto,
    public readonly produtoTipo?: ProdutoTipoDoProduto,
    public readonly precoPromocional?: number,
    /** FK real pra Categoria — não confundir com `categoria` (texto livre legado,
     * ainda a fonte do filtro de listagem). Usado só pra elegibilidade de
     * restrição de cupom/atacado por categoria (ver Cupom.ehElegivel). */
    public readonly categoriaId?: string,
    /** Thumbnail (300x300, já com transformação Cloudinary) da imagem de ordem 0,
     * se houver — embutido aqui pra listagem (catálogo, mais vendidos, etc.) não
     * precisar de uma chamada GET /produtos/:id/imagens por card (era N+1 real,
     * chegava a estourar rate-limit só carregando a home). Página de detalhe
     * continua usando listarImagensProduto pra pegar a galeria completa. */
    public readonly imagemPrincipalThumbnailUrl?: string,
  ) {}

  possuiEstoqueDisponivel(quantidade: number): boolean {
    return this.estoque >= quantidade;
  }

  /** Promoção ativa = tem preço promocional cadastrado (a invariante de que ele é
   * menor que o preço normal é garantida na escrita, não precisa reconferir aqui). */
  estaEmPromocao(): boolean {
    return this.precoPromocional !== undefined;
  }

  /** Preço que efetivamente é cobrado — o promocional quando existe, senão o normal.
   * Único preço que carrinho/pedido devem usar (nunca `preco` direto), senão a
   * promoção que aparece na vitrine não bate com o que é cobrado no checkout. */
  precoEfetivo(): number {
    return this.precoPromocional ?? this.preco;
  }

  /** Retorna uma cópia da entidade com o produto ativado. */
  ativar(): Produto {
    return new Produto(
      this.id,
      this.nome,
      this.slug,
      this.preco,
      this.estoque,
      true,
      this.descricao,
      this.categoria,
      this.createdAt,
      this.updatedAt,
      this.pesoKg,
      this.alturaCm,
      this.larguraCm,
      this.comprimentoCm,
      this.pack,
      this.marca,
      this.produtoTipo,
      this.precoPromocional,
      this.categoriaId,
      this.imagemPrincipalThumbnailUrl,
    );
  }

  /** Retorna uma cópia da entidade com o produto desativado (soft delete lógico). */
  desativar(): Produto {
    return new Produto(
      this.id,
      this.nome,
      this.slug,
      this.preco,
      this.estoque,
      false,
      this.descricao,
      this.categoria,
      this.createdAt,
      this.updatedAt,
      this.pesoKg,
      this.alturaCm,
      this.larguraCm,
      this.comprimentoCm,
      this.pack,
      this.marca,
      this.produtoTipo,
      this.precoPromocional,
      this.categoriaId,
      this.imagemPrincipalThumbnailUrl,
    );
  }
}
