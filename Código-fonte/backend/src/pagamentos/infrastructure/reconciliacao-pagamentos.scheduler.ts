import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReconciliarPagamentosPendentesUseCase } from '../application/reconciliar-pagamentos-pendentes.use-case';

/** Dispara o job de reconciliação periodicamente — a lógica de negócio fica toda no use case. */
@Injectable()
export class ReconciliacaoPagamentosScheduler {
  private readonly logger = new Logger(ReconciliacaoPagamentosScheduler.name);

  constructor(
    private readonly reconciliarPagamentosPendentesUseCase: ReconciliarPagamentosPendentesUseCase,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async executar(): Promise<void> {
    try {
      await this.reconciliarPagamentosPendentesUseCase.executar();
    } catch (erro) {
      // O @Cron do @nestjs/schedule não tem pra onde propagar esse erro — só logamos,
      // pra não deixar uma rodada travada matar as próximas.
      this.logger.error(
        `Job de reconciliação falhou: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }
}
