import { DadosEntregaPedido, NovoItemPedido, Pedido } from './pedido.entity';
import { StatusPedido } from './status-pedido.enum';

export abstract class PedidoRepository {
  /**
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
    statusInicial?: StatusPedido,
    contexto?: unknown,
  ): Promise<Pedido>;
  abstract buscarPorId(id: string): Promise<Pedido | null>;

  /** Admin-only — ver PedidosController. Mais recentes primeiro. */
  abstract listarTodos(): Promise<Pedido[]>;

  /**
   * `contexto`, quando informado, é o contexto de transação devolvido por
   * `TransactionManager.executar` — usado para atualizar o status do pedido na mesma
   * transação do decremento/devolução de estoque correspondente.
   */
  abstract atualizarStatus(id: string, status: StatusPedido, contexto?: unknown): Promise<Pedido>;

  /** Admin-only — ver PedidosController. `codigoRastreio: null` limpa o campo. */
  abstract atualizarRastreio(id: string, codigoRastreio: string | null): Promise<Pedido>;
}
