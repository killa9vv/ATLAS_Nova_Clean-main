import { Injectable } from '@nestjs/common';
import { Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { PedidoNaoEncontradoException } from '../domain/pedidos.exceptions';

/** Detalhe de "meus pedidos" — mesmo código de erro (404) tanto pra pedido
 * inexistente quanto pra pedido de outro cliente, de propósito (não revela que o
 * pedido existe mas pertence a outra pessoa). Mesmo padrão de
 * ExcluirEnderecoUseCase pra endereço de outro cliente. */
@Injectable()
export class BuscarPedidoDoClienteUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async executar(id: string, clienteId: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id);
    if (!pedido || pedido.clienteId !== clienteId) {
      throw new PedidoNaoEncontradoException(id);
    }
    return pedido;
  }
}
