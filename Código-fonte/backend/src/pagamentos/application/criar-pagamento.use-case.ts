import { Injectable } from '@nestjs/common';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import {
  PedidoEmStatusInvalidoException,
  PedidoNaoEncontradoException,
} from '../../pedidos/domain/pedidos.exceptions';
import { MetodoPagamento } from '../domain/metodo-pagamento.enum';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway, ResultadoPagamentoGateway } from '../domain/payment-gateway.port';
import { StatusPagamento } from '../domain/status-pagamento.enum';
import { PagamentoRecusadoException } from '../domain/pagamentos.exceptions';
import { CriarPagamentoInput, CriarPagamentoOutput } from './dto/criar-pagamento-input';
import { ReconciliarPedidoService } from './reconciliar-pedido.service';

@Injectable()
export class CriarPagamentoUseCase {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly pagamentoRepository: PagamentoRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly reconciliarPedidoService: ReconciliarPedidoService,
  ) {}

  async executar(input: CriarPagamentoInput): Promise<CriarPagamentoOutput> {
    const pedido = await this.pedidoRepository.buscarPorId(input.pedidoId);
    if (!pedido) {
      throw new PedidoNaoEncontradoException(input.pedidoId);
    }
    if (!pedido.estaAguardandoPagamento()) {
      throw new PedidoEmStatusInvalidoException(
        `Pedido ${pedido.id} está com status ${pedido.status} e não pode receber um novo pagamento.`,
      );
    }

    const descricao = `Pedido ${pedido.id} - Atlas Nova Clean`;
    // pedido.total já inclui o frete (itens + valorFrete — ver CriarPedidoUseCase),
    // não soma de novo aqui.
    const contexto = {
      referenciaExterna: pedido.id,
      valor: pedido.total,
      descricao,
      pagador: input.pagador,
    };

    const resultado: ResultadoPagamentoGateway =
      input.metodo === MetodoPagamento.PIX
        ? await this.paymentGateway.criarPagamentoPix(contexto)
        : await this.paymentGateway.criarPagamentoCartao({
            ...contexto,
            tokenCartao: input.tokenCartao ?? '',
            parcelas: input.parcelas ?? 1,
            metodoPagamentoId: input.metodoPagamentoId ?? '',
          });

    const pagamento = await this.pagamentoRepository.criar({
      pedidoId: pedido.id,
      metodo: input.metodo,
      valor: pedido.total,
      status: resultado.status,
      gatewayTransactionId: resultado.gatewayTransactionId,
      gatewayPayload: resultado.payloadBruto,
    });

    // Cartão costuma resolver na hora (aprovado/recusado já na resposta síncrona do
    // gateway) — diferente do Pix, que nasce PENDENTE e só muda de status quando o
    // webhook chega depois. Sem isto, um cartão aprovado nunca dispararia a baixa de
    // estoque nem marcaria o pedido como PAGO: o webhook que eventualmente chega só
    // confirma um status que já está gravado desde a criação, então a checagem de
    // idempotência do ProcessarWebhookUseCase o descarta sem reconciliar nada.
    await this.reconciliarPedidoService.executar(pagamento);

    if (resultado.status === StatusPagamento.RECUSADO) {
      throw new PagamentoRecusadoException('a operadora recusou a transação.');
    }

    return {
      pagamentoId: pagamento.id,
      status: pagamento.status,
      qrCode: resultado.qrCode,
      qrCodeBase64: resultado.qrCodeBase64,
    };
  }
}
