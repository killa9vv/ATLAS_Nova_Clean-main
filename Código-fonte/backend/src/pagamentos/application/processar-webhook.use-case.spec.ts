import { ProcessarWebhookUseCase } from './processar-webhook.use-case';
import { ReconciliarPedidoService } from './reconciliar-pedido.service';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway } from '../domain/payment-gateway.port';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { TransactionManager } from '../../shared/prisma/transaction-manager';
import { Pagamento } from '../domain/pagamento.entity';
import { MetodoPagamento } from '../domain/metodo-pagamento.enum';
import { StatusPagamento } from '../domain/status-pagamento.enum';
import { Pedido, ItemPedidoEntity } from '../../pedidos/domain/pedido.entity';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { PagamentoNaoEncontradoException } from '../domain/pagamentos.exceptions';

function criarPagamento(status: StatusPagamento): Pagamento {
  return new Pagamento(
    'pag-1',
    'pedido-1',
    MetodoPagamento.PIX,
    status,
    100,
    'mp-123',
    new Date(),
    new Date(),
  );
}

function criarPedido(status: StatusPedido, itens: ItemPedidoEntity[] = []): Pedido {
  return new Pedido('pedido-1', status, itens, 100, new Date(), new Date());
}

describe('ProcessarWebhookUseCase (idempotência)', () => {
  let pagamentoRepository: jest.Mocked<PagamentoRepository>;
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let produtoRepository: jest.Mocked<ProdutoRepository>;
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let useCase: ProcessarWebhookUseCase;
  // Contexto de transação falso — só pra provar que o decremento de estoque e a
  // confirmação do pedido como PAGO recebem o MESMO contexto (mesma transação).
  const contextoFalso = { transacao: 'fake' };

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

    produtoRepository = {
      listarTodos: jest.fn(),
      listarComFiltros: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorIds: jest.fn(),
      buscarPorSlug: jest.fn(),
      criar: jest.fn(),
      atualizar: jest.fn(),
      decrementarEstoque: jest.fn().mockResolvedValue(undefined),
      incrementarEstoque: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProdutoRepository>;

    paymentGateway = {
      criarPagamentoPix: jest.fn(),
      criarPagamentoCartao: jest.fn(),
      consultarPagamento: jest.fn(),
    } as unknown as jest.Mocked<PaymentGateway>;

    transactionManager = {
      executar: jest.fn((fn: (contexto: unknown) => Promise<unknown>) => fn(contextoFalso)),
    } as unknown as jest.Mocked<TransactionManager>;

    const reconciliarPedidoService = new ReconciliarPedidoService(
      pedidoRepository,
      produtoRepository,
      transactionManager,
    );

    useCase = new ProcessarWebhookUseCase(
      pagamentoRepository,
      paymentGateway,
      reconciliarPedidoService,
    );
  });

  it('lança PagamentoNaoEncontradoException quando a transação do gateway é desconhecida', async () => {
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(null);

    await expect(useCase.executar('mp-desconhecido')).rejects.toBeInstanceOf(
      PagamentoNaoEncontradoException,
    );
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

  it('confirma o pagamento: decrementa o estoque e marca o pedido como PAGO na mesma transação', async () => {
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
    pedidoRepository.buscarPorId.mockResolvedValue(
      criarPedido(StatusPedido.AGUARDANDO_PAGAMENTO, [
        new ItemPedidoEntity('produto-1', 'Detergente', 2, 10),
      ]),
    );

    const resultado = await useCase.executar('mp-123');

    expect(resultado).toEqual({ processado: true });
    expect(pagamentoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pag-1',
      StatusPagamento.PENDENTE,
      StatusPagamento.APROVADO,
      { status: 'approved' },
    );
    expect(produtoRepository.decrementarEstoque).toHaveBeenCalledWith(
      [{ produtoId: 'produto-1', nome: 'Detergente', quantidade: 2 }],
      contextoFalso,
    );
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pedido-1',
      StatusPedido.PAGO,
      contextoFalso,
    );
  });

  it('não marca o pedido como PAGO quando o estoque acabou entre o checkout e a aprovação do pagamento', async () => {
    const pagamentoPendente = criarPagamento(StatusPagamento.PENDENTE);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(pagamentoPendente);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.APROVADO,
      valor: 100,
      payloadBruto: {},
    });
    pagamentoRepository.atualizarStatus.mockResolvedValue(criarPagamento(StatusPagamento.APROVADO));
    pedidoRepository.buscarPorId.mockResolvedValue(
      criarPedido(StatusPedido.AGUARDANDO_PAGAMENTO, [
        new ItemPedidoEntity('produto-1', 'Detergente', 5, 10),
      ]),
    );
    produtoRepository.decrementarEstoque.mockRejectedValue(
      new EstoqueInsuficienteException('Detergente'),
    );

    // O pagamento já foi capturado pelo gateway — não é um erro pro Mercado Pago
    // reentregar via retry, então o use case não relança: fica registrado como anomalia
    // pra reconciliação manual (ver log), mas a notificação em si foi "processada".
    const resultado = await useCase.executar('mp-123');

    expect(resultado).toEqual({ processado: true });
    expect(pedidoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it('cancelar um pedido que nunca chegou a ser pago não mexe no estoque (nada foi reservado)', async () => {
    const pagamentoPendente = criarPagamento(StatusPagamento.PENDENTE);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(pagamentoPendente);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.RECUSADO,
      valor: 100,
      payloadBruto: {},
    });
    pagamentoRepository.atualizarStatus.mockResolvedValue(criarPagamento(StatusPagamento.RECUSADO));
    pedidoRepository.buscarPorId.mockResolvedValue(
      criarPedido(StatusPedido.AGUARDANDO_PAGAMENTO, [
        new ItemPedidoEntity('produto-1', 'Detergente', 2, 10),
      ]),
    );

    await useCase.executar('mp-123');

    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pedido-1',
      StatusPedido.CANCELADO,
    );
    expect(produtoRepository.incrementarEstoque).not.toHaveBeenCalled();
  });

  it('permite a transição PAGO -> ESTORNADO (estorno após confirmação) e devolve o estoque que havia sido reservado', async () => {
    const pagamentoAprovado = criarPagamento(StatusPagamento.APROVADO);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(pagamentoAprovado);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.ESTORNADO,
      valor: 100,
      payloadBruto: {},
    });
    pagamentoRepository.atualizarStatus.mockResolvedValue(
      criarPagamento(StatusPagamento.ESTORNADO),
    );
    pedidoRepository.buscarPorId.mockResolvedValue(
      criarPedido(StatusPedido.PAGO, [new ItemPedidoEntity('produto-1', 'Detergente', 2, 10)]),
    );

    const resultado = await useCase.executar('mp-123');

    expect(resultado).toEqual({ processado: true });
    // atualizarStatus e incrementarEstoque recebem o MESMO contexto de transação —
    // devolução de estoque em estorno é tão atômica quanto a baixa na confirmação.
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pedido-1',
      StatusPedido.ESTORNADO,
      contextoFalso,
    );
    expect(produtoRepository.incrementarEstoque).toHaveBeenCalledWith(
      [{ produtoId: 'produto-1', quantidade: 2 }],
      contextoFalso,
    );
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
    expect(produtoRepository.decrementarEstoque).not.toHaveBeenCalled();
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

  it('trata como idempotente quando uma notificação concorrente já mudou o status entre a leitura e a escrita', async () => {
    // Corrida: duas notificações leem PENDENTE antes de qualquer uma escrever. A primeira
    // (não simulada aqui) já venceu — o UPDATE condicional desta chamada não afeta nenhuma
    // linha, então o repositório devolve null.
    const pagamentoPendente = criarPagamento(StatusPagamento.PENDENTE);
    pagamentoRepository.buscarPorGatewayTransactionId.mockResolvedValue(pagamentoPendente);
    paymentGateway.consultarPagamento.mockResolvedValue({
      gatewayTransactionId: 'mp-123',
      status: StatusPagamento.APROVADO,
      valor: 100,
      payloadBruto: {},
    });
    pagamentoRepository.atualizarStatus.mockResolvedValue(null);

    const resultado = await useCase.executar('mp-123');

    expect(resultado).toEqual({ processado: false, motivo: expect.any(String) });
    expect(pedidoRepository.atualizarStatus).not.toHaveBeenCalled();
    expect(produtoRepository.decrementarEstoque).not.toHaveBeenCalled();
  });
});
