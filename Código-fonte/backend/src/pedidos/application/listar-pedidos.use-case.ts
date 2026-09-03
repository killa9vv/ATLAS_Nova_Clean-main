import { Injectable } from '@nestjs/common';
import {
  FiltrosListagemPedidosAdmin,
  PedidoRepository,
  ResultadoPaginadoPedidos,
} from '../domain/pedido.repository';

/** Admin-only — ver PedidosController. Usado pelo painel admin (dashboard, gestão de pedidos). */
@Injectable()
export class ListarPedidosUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async executar(filtros: FiltrosListagemPedidosAdmin): Promise<ResultadoPaginadoPedidos> {
    return this.pedidoRepository.listarTodos(filtros);
  }
}
