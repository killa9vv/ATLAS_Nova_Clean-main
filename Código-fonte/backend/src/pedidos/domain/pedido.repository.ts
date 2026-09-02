import { ContatoPedido, DadosEntregaPedido, NovoItemPedido, Pedido } from './pedido.entity';
import { StatusPedido } from './status-pedido.enum';
import { HistoricoStatusPedido } from './historico-status-pedido.entity';

export interface FiltrosListagemPedidosCliente {
  pagina: number;
  limite: number;
  status?: StatusPedido;
}

export interface ResultadoPaginadoPedidos {
  itens: Pedido[];
  total: number;
  pagina: number;
  limite: number;
}

export abstract class PedidoRepository {
  /**
   * `contato` é sempre exigido pela aplicação (garantido pelo DTO) — não há checkout
   * sem identificar o comprador. `clienteId`, quando informado, já foi validado pelo
   * use case (cliente existe) antes de chegar aqui.
   *
   * `statusInicial`, quando omitido, usa o default do banco (`CRIADO`). Existe pro
   * checkout do WhatsApp, que registra o pedido direto em `AGUARDANDO_CONTATO`.
   *
   * `contexto`, quando informado, é o contexto de transação devolvido por
   * `TransactionManager.executar` — usado para criar o pedido na mesma transação
   * atômica do decremento de estoque correspondente.
   */
  abstract criar(
    itens: NovoItemPedido[],
    total: number,
    entrega: DadosEntregaPedido,
    contato: ContatoPedido,
    clienteId?: string,
    statusInicial?: StatusPedido,
    contexto?: unknown,
  ): Promise<Pedido>;
  abstract buscarPorId(id: string): Promise<Pedido | null>;

  /** Admin-only — ver PedidosController. Mais recentes primeiro. */
  abstract listarTodos(): Promise<Pedido[]>;

  /** "Meus pedidos" — só os do próprio cliente autenticado, paginado, mais recentes primeiro. */
  abstract listarPorCliente(
    clienteId: string,
    filtros: FiltrosListagemPedidosCliente,
  ): Promise<ResultadoPaginadoPedidos>;

  /** Timeline de status pra rastreamento — mais recente primeiro. */
  abstract listarHistoricoStatus(pedidoId: string): Promise<HistoricoStatusPedido[]>;

  /**
   * `contexto`, quando informado, é o contexto de transação devolvido por
   * `TransactionManager.executar` — usado para atualizar o status do pedido na mesma
   * transação do decremento/devolução de estoque correspondente.
   */
  abstract atualizarStatus(id: string, status: StatusPedido, contexto?: unknown): Promise<Pedido>;

  /** Admin-only — ver PedidosController. `codigoRastreio: null` limpa o campo. */
  abstract atualizarRastreio(id: string, codigoRastreio: string | null): Promise<Pedido>;
}
