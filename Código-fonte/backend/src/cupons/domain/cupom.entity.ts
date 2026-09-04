export type TipoDesconto = 'PERCENTUAL' | 'VALOR_FIXO';

export class Cupom {
  constructor(
    public readonly id: string,
    public readonly codigo: string,
    public readonly tipoDesconto: TipoDesconto,
    public readonly valor: number,
    public readonly ativo: boolean,
    public readonly usosCount: number,
    public readonly createdAt: Date,
    public readonly validoAte?: Date,
    public readonly usoMaximo?: number,
  ) {}

  /** Inativo, expirado ou já no limite de usos — qualquer um desses barra aplicação nova. */
  estaValido(agora: Date = new Date()): boolean {
    if (!this.ativo) return false;
    if (this.validoAte && this.validoAte < agora) return false;
    if (this.usoMaximo !== undefined && this.usosCount >= this.usoMaximo) return false;
    return true;
  }

  /** Nunca deixa o desconto passar do subtotal — evita total negativo com cupom VALOR_FIXO
   * maior que a compra. Não valida `estaValido()` aqui de propósito: quem chama decide
   * quando checar validade (ver MontarCarrinhoUseCase). */
  calcularDesconto(subtotal: number): number {
    const bruto = this.tipoDesconto === 'PERCENTUAL' ? subtotal * (this.valor / 100) : this.valor;
    return Number(Math.min(bruto, subtotal).toFixed(2));
  }
}
