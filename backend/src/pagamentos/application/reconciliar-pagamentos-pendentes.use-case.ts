import { Injectable, Logger } from '@nestjs/common';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { ProcessarWebhookUseCase } from './processar-webhook.use-case';

/**
 * Pagamentos pendentes há mais tempo que isso são tratados como "webhook possivelmente
 * perdido" — tempo suficiente pra cobrir latência normal de confirmação (Pix costuma
 * confirmar em segundos; cartão, em minutos) sem gerar ruído consultando pagamentos que
 * ainda estão andando normalmente.
 */
const MINUTOS_PARA_CONSIDERAR_PERDIDO = 30;

/**
 * Reconcilia pagamentos que ficaram pendentes por tempo demais — cobre o caso em que a
 * notificação de webhook do Mercado Pago nunca chega (falha de rede do lado deles,
 * instabilidade, etc.) e o pedido ficaria travado em AGUARDANDO_PAGAMENTO pra sempre.
 * Consulta o gateway diretamente e reaproveita toda a lógica de idempotência/efeitos
 * colaterais do processamento normal de webhook — chamado por
 * ReconciliacaoPagamentosScheduler (@Cron) em produção.
 */
@Injectable()
export class ReconciliarPagamentosPendentesUseCase {
  private readonly logger = new Logger(ReconciliarPagamentosPendentesUseCase.name);

  constructor(
    private readonly pagamentoRepository: PagamentoRepository,
    private readonly processarWebhookUseCase: ProcessarWebhookUseCase,
  ) {}

  async executar(): Promise<void> {
    const limite = new Date(Date.now() - MINUTOS_PARA_CONSIDERAR_PERDIDO * 60_000);
    const pendentes = await this.pagamentoRepository.listarPendentesCriadosAntesDe(limite);

    if (pendentes.length === 0) {
      return;
    }

    this.logger.log(
      `${pendentes.length} pagamento(s) pendente(s) há mais de ${MINUTOS_PARA_CONSIDERAR_PERDIDO}min — consultando o gateway.`,
    );

    for (const pagamento of pendentes) {
      // gatewayTransactionId nunca é null aqui — já filtrado em listarPendentesCriadosAntesDe.
      const gatewayTransactionId = pagamento.gatewayTransactionId as string;
      try {
        const resultado = await this.processarWebhookUseCase.executar(gatewayTransactionId);
        if (resultado.processado) {
          this.logger.warn(
            `Pagamento ${pagamento.id} (pedido ${pagamento.pedidoId}) foi atualizado pela reconciliação — ` +
              'o webhook original provavelmente se perdeu.',
          );
        }
      } catch (erro) {
        this.logger.error(
          `Falha ao reconciliar pagamento ${pagamento.id}: ${erro instanceof Error ? erro.message : String(erro)}`,
        );
      }
    }
  }
}
