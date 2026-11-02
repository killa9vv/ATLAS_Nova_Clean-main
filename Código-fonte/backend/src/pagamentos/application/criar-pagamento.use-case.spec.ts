// Cobre especificamente o valor cobrado do cliente: pedido.total já inclui o frete
// (itens + valorFrete — ver CriarPedidoUseCase), então o gateway e o registro de
// Pagamento devem usar pedido.total sozinho, nunca "total + valorFrete" de novo
// (bug real encontrado na reconciliação com o PR de rateio de frete por CEP: o
// código chegou a somar pedido.total + pedido.freteTotal, cobrando o frete em dobro).
import { CriarPagamentoUseCase } from './criar-pagamento.use-case';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { Pedido } from '../../pedidos/domain/pedido.entity';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway } from '../domain/payment-gateway.port';
import { Pagamento } from '../domain/pagamento.entity';
import { MetodoPagamento } from '../domain/metodo-pagamento.enum';
import { StatusPagamento } from '../domain/status-pagamento.enum';
import { ReconciliarPedidoService } from './reconciliar-pedido.service';
import { PedidoNaoEncontradoException } from '../../pedidos/domain/pedidos.exceptions';
import { PagamentoRecusadoException } from '../domain/pagamentos.exceptions';

describe('CriarPagamentoUseCase', () => {
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let pagamentoRepository: jest.Mocked<PagamentoRepository>;
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let reconciliarPedidoService: jest.Mocked<ReconciliarPedidoService>;
  let useCase: CriarPagamentoUseCase;

  // itens (10) + valorFrete (12) = total (22) — total já é o valor final cobrado.
  const pedido = new Pedido(
    'pedido-1',
    '2026-000001',
    StatusPedido.CRIADO,
    [],
    22,
    'ENTREGA',
    12,
    new Date(),
    new Date(),
  );

  beforeEach(() => {
    pedidoRepository = {
      buscarPorId: jest.fn().mockResolvedValue(pedido),
    } as unknown as jest.Mocked<PedidoRepository>;

    pagamentoRepository = {
      criar: jest
        .fn()
        .mockResolvedValue(
          new Pagamento(
            'pagamento-1',
            pedido.id,
            MetodoPagamento.PIX,
            StatusPagamento.PENDENTE,
            22,
            'mp-1',
            new Date(),
            new Date(),
          ),
        ),
    } as unknown as jest.Mocked<PagamentoRepository>;

    paymentGateway = {
      criarPagamentoPix: jest.fn().mockResolvedValue({
        gatewayTransactionId: 'mp-1',
        status: StatusPagamento.PENDENTE,
        valor: 22,
        payloadBruto: {},
      }),
      criarPagamentoCartao: jest.fn(),
    } as unknown as jest.Mocked<PaymentGateway>;

    reconciliarPedidoService = {
      executar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ReconciliarPedidoService>;

    useCase = new CriarPagamentoUseCase(
      pedidoRepository,
      pagamentoRepository,
      paymentGateway,
      reconciliarPedidoService,
    );
  });

  it('cobra pedido.total (itens + frete já somados), não total + valorFrete de novo', async () => {
    await useCase.executar({
      pedidoId: pedido.id,
      metodo: MetodoPagamento.PIX,
      pagador: { email: 'cliente@teste.com' },
    });

    expect(paymentGateway.criarPagamentoPix).toHaveBeenCalledWith(
      expect.objectContaining({ valor: 22 }),
    );
    expect(pagamentoRepository.criar).toHaveBeenCalledWith(expect.objectContaining({ valor: 22 }));
  });

  it('cartão recusado mostra ao cliente o motivo devolvido pelo gateway', async () => {
    paymentGateway.criarPagamentoCartao.mockResolvedValue({
      gatewayTransactionId: 'mp-2',
      status: StatusPagamento.RECUSADO,
      valor: 22,
      motivoRecusa: 'confira o código de segurança.',
      codigoMotivo: 'cc_rejected_bad_filled_security_code',
      payloadBruto: {},
    });

    const pagamento = useCase.executar({
      pedidoId: pedido.id,
      metodo: MetodoPagamento.CARTAO_CREDITO,
      tokenCartao: 'tok',
      parcelas: 1,
      metodoPagamentoId: 'master',
      pagador: { email: 'cliente@teste.com' },
    });

    await expect(pagamento).rejects.toBeInstanceOf(PagamentoRecusadoException);
    await expect(pagamento).rejects.toThrow('confira o código de segurança.');
  });

  it('lança PedidoNaoEncontradoException quando o pedido não existe', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(
      useCase.executar({
        pedidoId: 'inexistente',
        metodo: MetodoPagamento.PIX,
        pagador: { email: 'cliente@teste.com' },
      }),
    ).rejects.toBeInstanceOf(PedidoNaoEncontradoException);
  });
});
