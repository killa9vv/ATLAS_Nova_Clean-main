import { AtualizarRastreioPedidoUseCase } from './atualizar-rastreio-pedido.use-case';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';
import { PedidoNaoEncontradoException } from '../domain/pedidos.exceptions';

describe('AtualizarRastreioPedidoUseCase', () => {
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let useCase: AtualizarRastreioPedidoUseCase;

  beforeEach(() => {
    pedidoRepository = {
      buscarPorId: jest.fn(),
      atualizarRastreio: jest.fn(),
    } as unknown as jest.Mocked<PedidoRepository>;

    useCase = new AtualizarRastreioPedidoUseCase(pedidoRepository);
  });

  it('lança PedidoNaoEncontradoException quando o pedido não existe', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.executar('inexistente', 'BR123')).rejects.toBeInstanceOf(
      PedidoNaoEncontradoException,
    );
    expect(pedidoRepository.atualizarRastreio).not.toHaveBeenCalled();
  });

  it('grava o código de rastreio, sem exigir nenhum status específico', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(
      new Pedido(
        'pedido-1',
        '2026-000001',
        StatusPedido.PAGO,
        [],
        20,
        'RETIRADA',
        0,
        new Date(),
        new Date(),
      ),
    );

    await useCase.executar('pedido-1', 'BR123456789BR');

    expect(pedidoRepository.atualizarRastreio).toHaveBeenCalledWith('pedido-1', 'BR123456789BR');
  });

  it('aceita null pra limpar o campo', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(
      new Pedido(
        'pedido-1',
        '2026-000001',
        StatusPedido.PAGO,
        [],
        20,
        'RETIRADA',
        0,
        new Date(),
        new Date(),
      ),
    );

    await useCase.executar('pedido-1', null);

    expect(pedidoRepository.atualizarRastreio).toHaveBeenCalledWith('pedido-1', null);
  });
});
