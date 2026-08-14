// Entidade de domínio Produto — representa um item do catálogo com preço e estoque.
export class Produto {
  constructor(
    public readonly id: string,
    public readonly nome: string,
    public readonly preco: number,
    public readonly estoque: number,
    public readonly descricao?: string,
  ) {}

  possuiEstoqueDisponivel(quantidade: number): boolean {
    return this.estoque >= quantidade;
  }
}
