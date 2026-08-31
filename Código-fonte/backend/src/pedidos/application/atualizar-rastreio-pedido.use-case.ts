import { Injectable } from '@nestjs/common';
import { Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { PedidoNaoEncontradoException } from '../domain/pedidos.exceptions';

/** Admin-only — ver PedidosController. Sem restrição de status: dá pra anotar o
 * rastreio a qualquer momento (e corrigir se digitou errado). */
@Injectable()
export class AtualizarRastreioPedidoUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async executar(id: string, codigoRastreio: string | null): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id);
    if (!pedido) {
      throw new PedidoNaoEncontradoException(id);
    }

    return this.pedidoRepository.atualizarRastreio(id, codigoRastreio);
  }
}
