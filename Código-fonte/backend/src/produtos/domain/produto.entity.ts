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
    );
  }
}
