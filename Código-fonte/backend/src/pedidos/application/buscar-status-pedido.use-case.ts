import { Injectable } from '@nestjs/common';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { PedidoNaoEncontradoException } from '../domain/pedidos.exceptions';

export interface ResultadoStatusPedido {
  pedido: Pedido;
  /** Só faz sentido enquanto o pedido aguarda pagamento — ver PedidoRepository. */
  ultimaTentativaDePagamentoFalhou: boolean;
}

/** Alimenta GET /pedidos/:id/status, que o checkout consulta enquanto o pagamento é decidido. */
@Injectable()
export class BuscarStatusPedidoUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async executar(id: string): Promise<ResultadoStatusPedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id);
    if (!pedido) {
      throw new PedidoNaoEncontradoException(id);
    }
    const ultimaTentativaDePagamentoFalhou = pedido.estaAguardandoPagamento()
      ? await this.pedidoRepository.ultimaTentativaDePagamentoFalhou(id)
      : false;
    return { pedido, ultimaTentativaDePagamentoFalhou };
  }
}
