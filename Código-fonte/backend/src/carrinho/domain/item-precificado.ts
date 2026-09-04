export class ItemPrecificado {
  constructor(
    public readonly produtoId: string,
    public readonly nome: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number,
    public readonly pesoKg?: number,
    public readonly alturaCm?: number,
    public readonly larguraCm?: number,
    public readonly comprimentoCm?: number,
  ) {}

  get subtotal(): number {
    return Number((this.precoUnitario * this.quantidade).toFixed(2));
  }
}

export class Carrinho {
  constructor(
    public readonly itens: ItemPrecificado[],
    /** 0 quando nenhum cupom foi aplicado. Já validado e calculado (ver Cupom.calcularDesconto)
     * — nunca maior que `total`. */
    public readonly desconto: number = 0,
    public readonly cupomCodigo?: string,
  ) {}

  /** Soma dos itens, SEM desconto — quem precisa do valor final (ex: CriarPedidoUseCase)
   * calcula `total - desconto` explicitamente, pra não esconder essa conta num getter. */
  get total(): number {
    return Number(this.itens.reduce((soma, item) => soma + item.subtotal, 0).toFixed(2));
  }
}
