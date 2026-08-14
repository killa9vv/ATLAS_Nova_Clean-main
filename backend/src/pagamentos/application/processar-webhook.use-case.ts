// Use case que processa notificações (webhook) do gateway de pagamento: consulta
// o status real, atualiza o pagamento de forma idempotente e reconcilia o pedido.
import { Injectable, Logger } from '@nestjs/common';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { Pagamento } from '../domain/pagamento.entity';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway } from '../domain/payment-gateway.port';
import { StatusPagamento } from '../domain/status-pagamento.enum';
import { PagamentoNaoEncontradoException } from '../domain/pagamentos.exceptions';
import { ProcessarWebhookOutput } from './dto/processar-webhook-output';

const STATUS_PAGAMENTO_PARA_PEDIDO: Partial<Record<StatusPagamento, StatusPedido>> = {
  [StatusPagamento.APROVADO]: StatusPedido.PAGO,
  [StatusPagamento.ESTORNADO]: StatusPedido.ESTORNADO,
  [StatusPagamento.RECUSADO]: StatusPedido.CANCELADO,
  [StatusPagamento.EXPIRADO]: StatusPedido.CANCELADO,
  [StatusPagamento.CANCELADO]: StatusPedido.CANCELADO,
};

/** Status de pedido considerados finais — não são sobrescritos automaticamente pela reconciliação. */
const STATUS_PEDIDO_FINAIS = new Set<StatusPedido>([
  StatusPedido.PAGO,
  StatusPedido.CANCELADO,
  StatusPedido.ESTORNADO,
]);

@Injectable()
export class ProcessarWebhookUseCase {
  private readonly logger = new Logger(ProcessarWebhookUseCase.name);

  constructor(
    private readonly pagamentoRepository: PagamentoRepository,
    private readonly pedidoRepository: PedidoRepository,
    private readonly paymentGateway: PaymentGateway,
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

    const pagamentoAtualizado = await this.pagamentoRepository.atualizarStatus(
      pagamento.id,
      resultado.status,
      resultado.payloadBruto,
    );

    await this.reconciliarPedido(pagamentoAtualizado);

    return { processado: true };
  }

  private async reconciliarPedido(pagamento: Pagamento): Promise<void> {
    const novoStatusPedido = STATUS_PAGAMENTO_PARA_PEDIDO[pagamento.status];
    if (!novoStatusPedido) {
      return;
    }

    const pedido = await this.pedidoRepository.buscarPorId(pagamento.pedidoId);
    if (!pedido) {
      this.logger.warn(
        `Pagamento ${pagamento.id} referencia pedido ${pagamento.pedidoId}, que não foi encontrado.`,
      );
      return;
    }

    if (STATUS_PEDIDO_FINAIS.has(pedido.status)) {
      if (pedido.status !== novoStatusPedido) {
        this.logger.warn(
          `Inconsistência detectada: pagamento ${pagamento.id} está ${pagamento.status} ` +
            `(sugere pedido ${novoStatusPedido}), mas pedido ${pedido.id} já está em ${pedido.status}. ` +
            'Requer reconciliação manual.',
        );
      }
      return;
    }

    await this.pedidoRepository.atualizarStatus(pedido.id, novoStatusPedido);
  }
}
