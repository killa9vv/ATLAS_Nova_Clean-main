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
        `Pedido ${pedido.id} estÃ¡ com status ${pedido.status} e nÃ£o pode receber um novo pagamento.`,
      );
    }

    const descricao = `Pedido ${pedido.id} - Atlas Nova Clean`;
    const contexto = {
      referenciaExterna: pedido.id,
      valor: pedido.total + pedido.freteTotal,
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
      valor: pedido.total + pedido.freteTotal,
      status: resultado.status,
      gatewayTransactionId: resultado.gatewayTransactionId,
      gatewayPayload: resultado.payloadBruto,
    });

    // CartÃ£o costuma resolver na hora (aprovado/recusado jÃ¡ na resposta sÃ­ncrona do
    // gateway) â€” diferente do Pix, que nasce PENDENTE e sÃ³ muda de status quando o
    // webhook chega depois. Sem isto, um cartÃ£o aprovado nunca dispararia a baixa de
    // estoque nem marcaria o pedido como PAGO: o webhook que eventualmente chega sÃ³
    // confirma um status que jÃ¡ estÃ¡ gravado desde a criaÃ§Ã£o, entÃ£o a checagem de
    // idempotÃªncia do ProcessarWebhookUseCase o descarta sem reconciliar nada.
    await this.reconciliarPedidoService.executar(pagamento);

    if (resultado.status === StatusPagamento.RECUSADO) {
      throw new PagamentoRecusadoException('a operadora recusou a transaÃ§Ã£o.');
    }

    return {
      pagamentoId: pagamento.id,
      status: pagamento.status,
      qrCode: resultado.qrCode,
      qrCodeBase64: resultado.qrCodeBase64,
    };
  }
}
