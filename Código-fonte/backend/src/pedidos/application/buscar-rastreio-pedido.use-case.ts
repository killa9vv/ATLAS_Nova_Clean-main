import { Injectable } from '@nestjs/common';
import { Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { HistoricoStatusPedido } from '../domain/historico-status-pedido.entity';
import { BuscarPedidoDoClienteUseCase } from './buscar-pedido-do-cliente.use-case';

export interface RastreioPedido {
  pedido: Pedido;
  historico: HistoricoStatusPedido[];
}

// Preparado pra integração futura com Melhor Envio/SuperFrete (webhook ou
// polling, ver card) — por enquanto o único jeito de codigoRastreio mudar é
// manual, via PATCH /pedidos/:id/rastreio do admin (AtualizarRastreioPedidoUseCase).
// A timeline vem de PedidoStatusHistorico, que já é escrita automaticamente a cada
// mudança de status (ver PrismaPedidoRepository.atualizarStatus).
@Injectable()
export class BuscarRastreioPedidoUseCase {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly buscarPedidoDoClienteUseCase: BuscarPedidoDoClienteUseCase,
  ) {}

  async executar(id: string, clienteId: string): Promise<RastreioPedido> {
    const pedido = await this.buscarPedidoDoClienteUseCase.executar(id, clienteId);
    const historico = await this.pedidoRepository.listarHistoricoStatus(id);
    return { pedido, historico };
  }
}
