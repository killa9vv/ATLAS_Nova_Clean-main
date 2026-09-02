import { StatusPedido } from './status-pedido.enum';

/** Uma entrada da timeline de status de um pedido — ver PedidoRepository.atualizarStatus,
 * que escreve isso automaticamente a cada mudança (nunca escrito diretamente por um use case). */
export class HistoricoStatusPedido {
  constructor(
    public readonly id: string,
    public readonly pedidoId: string,
    public readonly statusNovo: StatusPedido,
    public readonly alteradoEm: Date,
    public readonly statusAnterior?: StatusPedido,
  ) {}
}
