import { NovoItemPedido, Pedido } from './pedido.entity';
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
    statusInicial?: StatusPedido,
    contexto?: unknown,
    freteTotal?: number,
  ): Promise<Pedido>;
  abstract buscarPorId(id: string): Promise<Pedido | null>;

  /**
   * `contexto`, quando informado, é o contexto de transação devolvido por
   * `TransactionManager.executar` — usado para atualizar o status do pedido na mesma
   * transação do decremento/devolução de estoque correspondente.
   */
  abstract atualizarStatus(id: string, status: StatusPedido, contexto?: unknown): Promise<Pedido>;
}
