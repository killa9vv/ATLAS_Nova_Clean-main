import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CancelarPedidosAbandonadosUseCase } from '../application/cancelar-pedidos-abandonados.use-case';

/** Dispara o cancelamento de pedidos abandonados — a regra fica toda no use case. */
@Injectable()
export class CancelamentoPedidosAbandonadosScheduler {
  private readonly logger = new Logger(CancelamentoPedidosAbandonadosScheduler.name);

  constructor(
    private readonly cancelarPedidosAbandonadosUseCase: CancelarPedidosAbandonadosUseCase,
  ) {}

  // De hora em hora, não uma vez por dia: no Render grátis o processo reinicia a cada
  // deploy, e um horário fixo único pode cair justo numa janela em que ele não está de pé.
  @Cron(CronExpression.EVERY_HOUR)
  async executar(): Promise<void> {
    try {
      await this.cancelarPedidosAbandonadosUseCase.executar();
    } catch (erro) {
      this.logger.error(
        `Job de cancelamento de pedidos abandonados falhou: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }
}
