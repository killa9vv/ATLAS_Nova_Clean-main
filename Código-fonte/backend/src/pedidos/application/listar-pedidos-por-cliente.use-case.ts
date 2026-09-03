import { Injectable } from '@nestjs/common';
import {
  FiltrosListagemPedidosCliente,
  PedidoRepository,
  ResultadoPaginadoPedidos,
} from '../domain/pedido.repository';

/** "Meus pedidos" — só do próprio cliente autenticado (ver PedidosClienteController),
 * diferente de ListarPedidosUseCase (admin-only, sem filtro). */
@Injectable()
export class ListarPedidosPorClienteUseCase {
  constructor(private readonly pedidoRepository: PedidoRepository) {}

  async executar(
    clienteId: string,
    filtros: FiltrosListagemPedidosCliente,
  ): Promise<ResultadoPaginadoPedidos> {
    return this.pedidoRepository.listarPorCliente(clienteId, filtros);
  }
}
