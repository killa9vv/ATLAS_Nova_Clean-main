// Use case que busca um pedido pelo id, lançando exceção de domínio se não existir.
import { Injectable } from '@nestjs/common';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { PedidoNaoEncontradoException } from '../domain/pedidos.exceptions';

@Injectable()
export class BuscarPedidoPorIdUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async executar(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id);
    if (!pedido) {
      throw new PedidoNaoEncontradoException(id);
    }
    return pedido;
  }
}
