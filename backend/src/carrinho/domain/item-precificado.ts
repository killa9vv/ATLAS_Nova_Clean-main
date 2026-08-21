export class ItemPrecificado {
  constructor(
    public readonly produtoId: string,
    public readonly nome: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number,
  ) {}

  get subtotal(): number {
    return Number((this.precoUnitario * this.quantidade).toFixed(2));
  }
}

export class Carrinho {
  constructor(public readonly itens: ItemPrecificado[]) {}

  get total(): number {
    return Number(this.itens.reduce((soma, item) => soma + item.subtotal, 0).toFixed(2));
  }
}
