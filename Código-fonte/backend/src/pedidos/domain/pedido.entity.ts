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

export type TipoEntrega = 'ENTREGA' | 'RETIRADA';

/** Snapshot do endereço de destino no momento do pedido — não uma referência a
 * Endereco, pelo mesmo motivo de nome/precoUnitario em ItemPedido: o pedido não
 * pode mudar se o cliente editar/apagar o endereço cadastrado depois. */
export interface EnderecoEntregaPedido {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
}

/** Dados de entrega usados na criação do pedido. `endereco` só é usado (e obrigatório
 * pra quem chama) quando `tipoEntrega` é ENTREGA — em RETIRADA fica undefined. */
export interface DadosEntregaPedido {
  tipoEntrega: TipoEntrega;
  valorFrete: number;
  endereco?: EnderecoEntregaPedido;
}

export class Pedido {
  constructor(
    public readonly id: string,
    public readonly status: StatusPedido,
    public readonly itens: ItemPedidoEntity[],
    public readonly total: number,
    public readonly tipoEntrega: TipoEntrega,
    public readonly valorFrete: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly endereco?: EnderecoEntregaPedido,
  ) {}

  estaAguardandoPagamento(): boolean {
    return this.status === StatusPedido.CRIADO || this.status === StatusPedido.AGUARDANDO_PAGAMENTO;
  }
}
