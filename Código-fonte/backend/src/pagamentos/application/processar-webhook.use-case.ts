import { Injectable } from '@nestjs/common';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway } from '../domain/payment-gateway.port';
import { PagamentoNaoEncontradoException } from '../domain/pagamentos.exceptions';
import { ProcessarWebhookOutput } from './dto/processar-webhook-output';
import { ReconciliarPedidoService } from './reconciliar-pedido.service';

@Injectable()
export class ProcessarWebhookUseCase {
  constructor(
    private readonly pagamentoRepository: PagamentoRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly reconciliarPedidoService: ReconciliarPedidoService,
  ) {}

  async executar(gatewayTransactionId: string): Promise<ProcessarWebhookOutput> {
    const pagamento =
      await this.pagamentoRepository.buscarPorGatewayTransactionId(gatewayTransactionId);
    if (!pagamento) {
      throw new PagamentoNaoEncontradoException(gatewayTransactionId);
    }

    const resultado = await this.paymentGateway.consultarPagamento(gatewayTransactionId);

    // Idempotência: se o status consultado é igual ao já registrado, esta notificação
    // já foi processada antes (ou não trouxe nenhuma mudança real) — não repetimos efeitos colaterais.
    if (pagamento.status === resultado.status) {
      return { processado: false, motivo: 'status já refletido para esta transação (idempotente)' };
    }

    // atualizarStatus só escreve se o status no banco ainda for o que acabamos de ler
    // (pagamento.status). Se outra notificação concorrente já tiver escrito um status
    // diferente nesse intervalo, devolve null — fecha a janela de corrida que a checagem
    // acima (em memória) sozinha não fecharia.
    const pagamentoAtualizado = await this.pagamentoRepository.atualizarStatus(
      pagamento.id,
      pagamento.status,
      resultado.status,
      resultado.payloadBruto,
    );

    if (!pagamentoAtualizado) {
      return {
        processado: false,
        motivo: 'status alterado por notificação concorrente para esta transação (idempotente)',
      };
    }

    await this.reconciliarPedidoService.executar(pagamentoAtualizado);

    return { processado: true };
  }
}
