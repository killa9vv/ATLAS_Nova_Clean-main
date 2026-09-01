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
  ) {}

  possuiEstoqueDisponivel(quantidade: number): boolean {
    return this.estoque >= quantidade;
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
    );
  }
}
