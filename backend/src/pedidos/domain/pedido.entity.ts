// Entidades de domínio do pedido: itens e o pedido em si, com seu status e total.
import { StatusPedido } from './status-pedido.enum';

export class ItemPedidoEntity {
  constructor(
    public readonly produtoId: string,
    public readonly nome: string,
    public readonly quantidade: number,
    public readonly precoUnitario: number,
  ) {}
}

export interface NovoItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export class Pedido {
  constructor(
    public readonly id: string,
    public readonly status: StatusPedido,
    public readonly itens: ItemPedidoEntity[],
    public readonly total: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  estaAguardandoPagamento(): boolean {
    return this.status === StatusPedido.CRIADO || this.status === StatusPedido.AGUARDANDO_PAGAMENTO;
  }
}
