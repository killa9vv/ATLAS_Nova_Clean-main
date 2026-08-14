// Testes do ProcessarWebhookUseCase, focados na idempotência do processamento de notificações do gateway.
import { ProcessarWebhookUseCase } from './processar-webhook.use-case';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway } from '../domain/payment-gateway.port';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { Pagamento } from '../domain/pagamento.entity';
import { MetodoPagamento } from '../domain/metodo-pagamento.enum';
import { StatusPagamento } from '../domain/status-pagamento.enum';
import { Pedido } from '../../pedidos/domain/pedido.entity';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { PagamentoNaoEncontradoException } from '../domain/pagamentos.exceptions';

function criarPagamento(status: StatusPagamento): Pagamento {
  return new Pagamento('pag-1', 'pedido-1', MetodoPagamento.PIX, status, 100, 'mp-123', new Date(), new Date());
}

function criarPedido(status: StatusPedido): Pedido {
  return new Pedido('pedido-1', status, [], 100, new Date(), new Date());
}

describe('ProcessarWebhookUseCase (idempotência)', () => {
  let pagamentoRepository: jest.Mocked<PagamentoRepository>;
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let useCase: ProcessarWebhookUseCase;

  beforeEach(() => {
    pagamentoRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorGatewayTransactionId: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<PagamentoRepository>;

    pedidoRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<PedidoRepository>;

    paymentGateway = {
      criarPagamentoPix: jest.fn(),
      criarPagamentoCartao: jest.fn(),
      consultarPagamento: jest.fn(),
    } as unknown as jest.Mocked<PaymentGateway>;

    useCase = new ProcessarWebhookUseCase(pagamentoRepository, pedidoRepository, paymentGateway);
  });

  it('lança PagamentoNaoEncontradoException quando a transação do gateway é desconhecida', async () => {
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(null);

    await expect(useCase.executar('mp-desconhecido')).rejects.toBeInstanceOf(PagamentoNaoEncontradoException);
    expect(paymentGateway.consultarPagamento).not.toHaveBeenCalled();
  });

  it('é idempotente: reenviar a mesma notificação (status já refletido) não reaplica efeitos colaterais', async () => {
    const pagamentoJaAprovado = criarPagamento(StatusPagamento.APROVADO);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(pagamentoJaAprovado);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.APROVADO,
      valor: 100,
      payloadBruto: {},
    });

    const resultado = await useCase.executar('mp-123');

    expect(resultado).toEqual({ processado: false, motivo: expect.any(String) });
    expect(pagamentoRepository.atualizarStatus).not.toHaveBeenCalled();
    expect(pedidoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it('processa a primeira notificação de aprovação: atualiza pagamento e sincroniza o pedido para PAGO', async () => {
    const pagamentoPendente = criarPagamento(StatusPagamento.PENDENTE);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(pagamentoPendente);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.APROVADO,
      valor: 100,
      payloadBruto: { status: 'approved' },
    });
    const pagamentoAtualizado = criarPagamento(StatusPagamento.APROVADO);
    pagamentoRepository.atualizarStatus.mockResolvedValue(pagamentoAtualizado);
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.AGUARDANDO_PAGAMENTO));

    const resultado = await useCase.executar('mp-123');

    expect(resultado).toEqual({ processado: true });
    expect(pagamentoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pag-1',
      StatusPagamento.APROVADO,
      { status: 'approved' },
    );
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith('pedido-1', StatusPedido.PAGO);
  });

  it('não sobrescreve pedido já em status final quando o webhook sugere um status diferente (exige reconciliação manual)', async () => {
    const pagamentoPendente = criarPagamento(StatusPagamento.PENDENTE);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(pagamentoPendente);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.APROVADO,
      valor: 100,
      payloadBruto: {},
    });
    pagamentoRepository.atualizarStatus.mockResolvedValue(criarPagamento(StatusPagamento.APROVADO));
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.CANCELADO));

    const resultado = await useCase.executar('mp-123');

    expect(resultado).toEqual({ processado: true });
    expect(pedidoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it('processando a mesma notificação duas vezes seguidas só sincroniza o pedido na primeira vez', async () => {
    const pagamentoPendente = criarPagamento(StatusPagamento.PENDENTE);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValueOnce(pagamentoPendente);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.APROVADO,
      valor: 100,
      payloadBruto: {},
    });
    const pagamentoAprovado = criarPagamento(StatusPagamento.APROVADO);
    pagamentoRepository.atualizarStatus.mockResolvedValue(pagamentoAprovado);
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.AGUARDANDO_PAGAMENTO));

    await useCase.executar('mp-123');

    // segunda entrega da mesma notificação: agora o repositório já reflete o status aprovado
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValueOnce(pagamentoAprovado);
    const segundaExecucao = await useCase.executar('mp-123');

    expect(segundaExecucao.processado).toBe(false);
    expect(pagamentoRepository.atualizarStatus).toHaveBeenCalledTimes(1);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledTimes(1);
  });
});
