import { Injectable, Logger } from '@nestjs/common';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import {
  OrigemTransicaoPedido,
  PedidoStateMachine,
} from '../../pedidos/domain/pedido-state-machine';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';

/**
 * Pedido online que passou disso sem nenhum pagamento vivo é dado como abandonado.
 * Folgado de propósito: o cliente pode voltar no mesmo dia pra tentar outro cartão.
 */
const HORAS_PARA_CONSIDERAR_ABANDONADO = 24;

/**
 * Cancela pedidos do checkout online que ficaram sem pagamento — cliente fechou a
 * página no formulário do Mercado Pago, ou todas as tentativas falharam (cartão
 * recusado, Pix expirado). Falha de pagamento não cancela o pedido na hora (ver
 * ReconciliarPedidoService), então sem isto eles ficariam "aguardando pagamento" pra
 * sempre na lista do admin.
 *
 * Nunca toca pedido com pagamento PENDENTE/EM_PROCESSAMENTO (um Pix ainda pode ser
 * pago — quem resolve esse caso é ReconciliarPagamentosPendentesUseCase, quando o
 * Mercado Pago expira o Pix). Nada a devolver: estoque e uso de cupom só são
 * contabilizados na confirmação do pagamento. Chamado por
 * CancelamentoPedidosAbandonadosScheduler (@Cron).
 */
@Injectable()
export class CancelarPedidosAbandonadosUseCase {
  private readonly logger = new Logger(CancelarPedidosAbandonadosUseCase.name);
  private readonly stateMachine = new PedidoStateMachine();

  constructor(private readonly pedidoRepository: PedidoRepository) {}

  /** Devolve quantos pedidos foram cancelados. */
  async executar(agora: Date = new Date()): Promise<number> {
    const limite = new Date(agora.getTime() - HORAS_PARA_CONSIDERAR_ABANDONADO * 3_600_000);
    const abandonados = await this.pedidoRepository.listarAbandonadosCriadosAntesDe(limite);

    let cancelados = 0;
    for (const pedido of abandonados) {
      try {
        this.stateMachine.validar(
          pedido.status,
          StatusPedido.CANCELADO,
          OrigemTransicaoPedido.SISTEMA_PAGAMENTO,
        );
        await this.pedidoRepository.atualizarStatus(pedido.id, StatusPedido.CANCELADO);
        cancelados += 1;
      } catch (erro) {
        this.logger.error(
          `Falha ao cancelar pedido abandonado ${pedido.id}: ${erro instanceof Error ? erro.message : String(erro)}`,
        );
      }
    }

    if (cancelados > 0) {
      this.logger.log(
        `${cancelados} pedido(s) sem pagamento há mais de ${HORAS_PARA_CONSIDERAR_ABANDONADO}h cancelado(s).`,
      );
    }
    return cancelados;
  }
}
