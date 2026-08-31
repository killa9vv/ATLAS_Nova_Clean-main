import { Injectable } from '@nestjs/common';
import { Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';

/** Admin-only — ver PedidosController. Usado pelo painel admin (dashboard, gestão de pedidos). */
@Injectable()
export class ListarPedidosUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async executar(): Promise<Pedido[]> {
    return this.pedidoRepository.listarTodos();
  }
}
