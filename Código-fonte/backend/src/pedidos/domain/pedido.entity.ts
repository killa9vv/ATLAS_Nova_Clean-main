import { StatusPedido } from './status-pedido.enum';

export class ItemPedidoEntity {
  constructor(
    public readonly produtoId: string,
    public readonly nome: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number,
    public readonly freteRateado: number = 0,
  ) {}
}

export interface NovoItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  freteRateado?: number;
}

export class Pedido {
  constructor(
    public readonly id: string,
    public readonly status: StatusPedido,
    public readonly itens: ItemPedidoEntity[],
    public readonly total: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly freteTotal: number = 0,
  ) {}

  estaAguardandoPagamento(): boolean {
    return this.status === StatusPedido.CRIADO || this.status === StatusPedido.AGUARDANDO_PAGAMENTO;
  }
}
