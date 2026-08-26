import { Injectable, Logger } from '@nestjs/common';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { Pedido } from '../../pedidos/domain/pedido.entity';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { TransactionManager } from '../../shared/prisma/transaction-manager';
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
    private readonly produtoRepository: ProdutoRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly transactionManager: TransactionManager,
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

    if (pedido.status === novoStatusPedido) {
      return;
    }

    if (
      STATUS_PEDIDO_FINAIS.has(pedido.status) &&
      !this.transicaoFinalPermitida(pedido.status, novoStatusPedido)
    ) {
      this.logger.warn(
        `Inconsistência detectada: pagamento ${pagamento.id} está ${pagamento.status} ` +
          `(sugere pedido ${novoStatusPedido}), mas pedido ${pedido.id} já está em ${pedido.status}. ` +
          'Requer reconciliação manual.',
      );
      return;
    }

    if (novoStatusPedido === StatusPedido.PAGO) {
      await this.confirmarPagamento(pedido, pagamento);
      return;
    }

    // O estoque só foi decrementado se o pedido chegou a ser marcado como PAGO (ver
    // confirmarPagamento) — a criação do pedido em si não reserva nada. Cancelar um
    // pedido que nunca chegou a ser pago não tem o que devolver.
    const estoqueHaviaSidoReservado = pedido.status === StatusPedido.PAGO;

    await this.pedidoRepository.atualizarStatus(pedido.id, novoStatusPedido);

    if (estoqueHaviaSidoReservado) {
      await this.produtoRepository.incrementarEstoque(
        pedido.itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
      );
    }
  }

  /**
   * Decrementa o estoque dos itens do pedido e marca o pedido como PAGO na mesma
   * transação — é aqui, na confirmação do pagamento (não no checkout), que o estoque é
   * de fato reservado (ver decisão documentada no README raiz). Entre o checkout e a
   * aprovação do pagamento o item pode ter sido vendido por outro pedido que pagou
   * primeiro; nesse caso o decremento falha e NÃO marcamos o pedido como PAGO — o
   * pagamento já foi capturado pelo gateway, então isso vira uma anomalia que precisa
   * de intervenção humana (normalmente estornar o cliente), não um erro para o
   * Mercado Pago reentregar via retry.
   */
  private async confirmarPagamento(pedido: Pedido, pagamento: Pagamento): Promise<void> {
    try {
      await this.transactionManager.executar(async (contexto) => {
        await this.produtoRepository.decrementarEstoque(
          pedido.itens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
          })),
          contexto,
        );
        await this.pedidoRepository.atualizarStatus(pedido.id, StatusPedido.PAGO, contexto);
      });
    } catch (erro) {
      if (erro instanceof EstoqueInsuficienteException) {
        this.logger.error(
          `Pagamento ${pagamento.id} do pedido ${pedido.id} foi aprovado pelo gateway, mas o estoque ` +
            `não está mais disponível (${erro.message}). O pedido NÃO foi marcado como PAGO. ` +
            'Requer reconciliação manual — provavelmente estornar o cliente.',
        );
        return;
      }
      throw erro;
    }
  }

  /**
   * PAGO é tratado como final pra reconciliação em geral (webhooks fora de ordem não
   * devem regredir um pedido já pago), mas um estorno é uma transição legítima a partir
   * dele — é o único caso em que um pedido final pode mudar de status aqui.
   */
  private transicaoFinalPermitida(statusAtual: StatusPedido, novoStatus: StatusPedido): boolean {
    return statusAtual === StatusPedido.PAGO && novoStatus === StatusPedido.ESTORNADO;
  }
}
