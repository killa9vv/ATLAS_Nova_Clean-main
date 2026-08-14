// Use case que cria um pagamento para um pedido: valida o status do pedido,
// aciona o gateway (Pix ou cartão) e persiste o resultado.
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

@Injectable()
export class CriarPagamentoUseCase {
  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly pagamentoRepository: PagamentoRepository,
    private readonly paymentGateway: PaymentGateway,
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
