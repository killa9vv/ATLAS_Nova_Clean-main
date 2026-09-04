// Cobre a mesma invariante de estoque do fluxo automático (ReconciliarPedidoService),
// só que disparada manualmente pelo admin: decrementa só ao entrar em PAGO, devolve só
// ao sair de PAGO pra CANCELADO/ESTORNADO (não pra SEPARACAO — a venda continua de pé,
// só mudou de fase), e rejeita qualquer transição fora da PedidoStateMachine.
import { AtualizarStatusPedidoUseCase } from './atualizar-status-pedido.use-case';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido, ItemPedidoEntity } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';
import {
  PedidoEmStatusInvalidoException,
  PedidoNaoEncontradoException,
} from '../domain/pedidos.exceptions';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { CupomRepository } from '../../cupons/domain/cupom.repository';
import { TransactionManager } from '../../shared/prisma/transaction-manager';

describe('AtualizarStatusPedidoUseCase', () => {
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let produtoRepository: jest.Mocked<ProdutoRepository>;
  let cupomRepository: jest.Mocked<CupomRepository>;
  let transactionManager: jest.Mocked<TransactionManager>;
  let useCase: AtualizarStatusPedidoUseCase;

  const contextoFalso = { transacao: 'fake' };
  const itens = [new ItemPedidoEntity('produto-1', 'Detergente', 2, 10)];

  function criarPedido(status: StatusPedido, cupomCodigo?: string): Pedido {
    return new Pedido(
      'pedido-1',
      '2026-000001',
      status,
      itens,
      20,
      'RETIRADA',
      0,
      new Date(),
      new Date(),
      undefined,
      undefined,
      undefined,
      undefined,
      0,
      cupomCodigo,
    );
  }

  beforeEach(() => {
    pedidoRepository = {
      buscarPorId: jest.fn(),
      atualizarStatus: jest.fn((id, status) => Promise.resolve(criarPedido(status))),
    } as unknown as jest.Mocked<PedidoRepository>;

    produtoRepository = {
      decrementarEstoque: jest.fn().mockResolvedValue(undefined),
      incrementarEstoque: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProdutoRepository>;

    cupomRepository = {
      incrementarUsos: jest.fn().mockResolvedValue(undefined),
      decrementarUsos: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CupomRepository>;

    transactionManager = {
      executar: jest.fn((fn: (contexto: unknown) => Promise<unknown>) => fn(contextoFalso)),
    } as unknown as jest.Mocked<TransactionManager>;

    useCase = new AtualizarStatusPedidoUseCase(
      pedidoRepository,
      produtoRepository,
      cupomRepository,
      transactionManager,
    );
  });

  it('lança PedidoNaoEncontradoException quando o pedido não existe', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.executar('inexistente', StatusPedido.CANCELADO)).rejects.toBeInstanceOf(
      PedidoNaoEncontradoException,
    );
  });

  it('CRIADO → CANCELADO: só muda o status, sem tocar em estoque (nunca foi decrementado)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.CRIADO));

    await useCase.executar('pedido-1', StatusPedido.CANCELADO);

    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pedido-1',
      StatusPedido.CANCELADO,
    );
    expect(produtoRepository.incrementarEstoque).not.toHaveBeenCalled();
    expect(transactionManager.executar).not.toHaveBeenCalled();
  });

  it('AGUARDANDO_CONTATO → PAGO: decrementa estoque e marca PAGO na mesma transação', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.AGUARDANDO_CONTATO));

    await useCase.executar('pedido-1', StatusPedido.PAGO);

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

  it('PAGO → ESTORNADO: devolve estoque e muda status na mesma transação', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.PAGO));

    await useCase.executar('pedido-1', StatusPedido.ESTORNADO);

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

  it('PAGO → CANCELADO: também devolve estoque (mesma lógica de saída de PAGO)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.PAGO));

    await useCase.executar('pedido-1', StatusPedido.CANCELADO);

    expect(produtoRepository.incrementarEstoque).toHaveBeenCalled();
  });

  it('PAGO → SEPARACAO: muda o status SEM devolver estoque (a venda continua de pé, só mudou de fase)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.PAGO));

    await useCase.executar('pedido-1', StatusPedido.SEPARACAO);

    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pedido-1',
      StatusPedido.SEPARACAO,
    );
    expect(produtoRepository.incrementarEstoque).not.toHaveBeenCalled();
    expect(transactionManager.executar).not.toHaveBeenCalled();
  });

  it('SEPARACAO → ENVIADO → ENTREGUE: esteira de cumprimento avança sem tocar em estoque', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.SEPARACAO));
    await useCase.executar('pedido-1', StatusPedido.ENVIADO);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith('pedido-1', StatusPedido.ENVIADO);

    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.ENVIADO));
    await useCase.executar('pedido-1', StatusPedido.ENTREGUE);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith(
      'pedido-1',
      StatusPedido.ENTREGUE,
    );

    expect(produtoRepository.incrementarEstoque).not.toHaveBeenCalled();
    expect(produtoRepository.decrementarEstoque).not.toHaveBeenCalled();
  });

  it('rejeita CRIADO → PAGO (não é um caminho manual permitido — só via pagamento online)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.CRIADO));

    await expect(useCase.executar('pedido-1', StatusPedido.PAGO)).rejects.toBeInstanceOf(
      PedidoEmStatusInvalidoException,
    );
    expect(pedidoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it('rejeita cancelamento a partir de SEPARACAO (já foi pra separação física — sem volta pelo sistema)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.SEPARACAO));

    await expect(useCase.executar('pedido-1', StatusPedido.CANCELADO)).rejects.toBeInstanceOf(
      PedidoEmStatusInvalidoException,
    );
    expect(pedidoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  it('rejeita pular etapa da esteira (PAGO → ENVIADO, sem passar por SEPARACAO)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.PAGO));

    await expect(useCase.executar('pedido-1', StatusPedido.ENVIADO)).rejects.toBeInstanceOf(
      PedidoEmStatusInvalidoException,
    );
  });

  it('rejeita transição a partir de um status final (CANCELADO → qualquer coisa)', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.CANCELADO));

    await expect(useCase.executar('pedido-1', StatusPedido.PAGO)).rejects.toBeInstanceOf(
      PedidoEmStatusInvalidoException,
    );
  });

  it('propaga EstoqueInsuficienteException sem marcar como PAGO quando o decremento falha', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.AGUARDANDO_CONTATO));
    const erro = new Error('sem estoque');
    produtoRepository.decrementarEstoque.mockRejectedValue(erro);

    await expect(useCase.executar('pedido-1', StatusPedido.PAGO)).rejects.toThrow('sem estoque');
    expect(pedidoRepository.atualizarStatus).not.toHaveBeenCalled();
  });

  describe('cupom', () => {
    it('AGUARDANDO_CONTATO → PAGO com cupom: incrementa o uso do cupom na mesma transação', async () => {
      pedidoRepository.buscarPorId.mockResolvedValue(
        criarPedido(StatusPedido.AGUARDANDO_CONTATO, 'DESCONTO10'),
      );

      await useCase.executar('pedido-1', StatusPedido.PAGO);

      expect(cupomRepository.incrementarUsos).toHaveBeenCalledWith('DESCONTO10', contextoFalso);
    });

    it('PAGO → CANCELADO com cupom: devolve o uso do cupom na mesma transação', async () => {
      pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.PAGO, 'DESCONTO10'));

      await useCase.executar('pedido-1', StatusPedido.CANCELADO);

      expect(cupomRepository.decrementarUsos).toHaveBeenCalledWith('DESCONTO10', contextoFalso);
    });

    it('PAGO → SEPARACAO com cupom: NÃO mexe no uso do cupom (venda continua de pé)', async () => {
      pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.PAGO, 'DESCONTO10'));

      await useCase.executar('pedido-1', StatusPedido.SEPARACAO);

      expect(cupomRepository.incrementarUsos).not.toHaveBeenCalled();
      expect(cupomRepository.decrementarUsos).not.toHaveBeenCalled();
    });

    it('sem cupom no pedido, nenhum método de cupom é chamado', async () => {
      pedidoRepository.buscarPorId.mockResolvedValue(criarPedido(StatusPedido.AGUARDANDO_CONTATO));

      await useCase.executar('pedido-1', StatusPedido.PAGO);

      expect(cupomRepository.incrementarUsos).not.toHaveBeenCalled();
      expect(cupomRepository.decrementarUsos).not.toHaveBeenCalled();
    });
  });
});
