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

/** Snapshot do contato de quem comprou, pelo mesmo motivo de EnderecoEntregaPedido:
 * o pedido não pode mudar se o cliente editar o cadastro depois. `nome` é sempre
 * exigido pelo DTO de criação — não há checkout anônimo sem identificar o comprador. */
export interface ContatoPedido {
  nome: string;
  email?: string;
  telefone?: string;
}

export class Pedido {
  constructor(
    public readonly id: string,
    /** Número legível pro cliente (ex: "2026-000123") — ver PedidoRepository.criar. */
    public readonly numero: string,
    public readonly status: StatusPedido,
    public readonly itens: ItemPedidoEntity[],
    public readonly total: number,
    public readonly tipoEntrega: TipoEntrega,
    public readonly valorFrete: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly endereco?: EnderecoEntregaPedido,
    public readonly codigoRastreio?: string,
    public readonly contato?: ContatoPedido,
    public readonly clienteId?: string,
    /** 0 quando nenhum cupom foi usado. */
    public readonly desconto: number = 0,
    public readonly cupomCodigo?: string,
  ) {}

  estaAguardandoPagamento(): boolean {
    return this.status === StatusPedido.CRIADO || this.status === StatusPedido.AGUARDANDO_PAGAMENTO;
  }
}
