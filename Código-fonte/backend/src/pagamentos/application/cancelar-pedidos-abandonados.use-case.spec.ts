import { CancelarPedidosAbandonadosUseCase } from './cancelar-pedidos-abandonados.use-case';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { Pedido } from '../../pedidos/domain/pedido.entity';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';

function criarPedido(id: string, status: StatusPedido): Pedido {
  return new Pedido(id, `2026-${id}`, status, [], 100, 'RETIRADA', 0, new Date(), new Date());
}

describe('CancelarPedidosAbandonadosUseCase', () => {
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let useCase: CancelarPedidosAbandonadosUseCase;

  beforeEach(() => {
    pedidoRepository = {
      listarAbandonadosCriadosAntesDe: jest.fn().mockResolvedValue([]),
      atualizarStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PedidoRepository>;
    useCase = new CancelarPedidosAbandonadosUseCase(pedidoRepository);
  });

  it('busca só pedidos criados há mais de 24h', async () => {
    const agora = new Date('2026-11-01T12:00:00Z');

    await useCase.executar(agora);

    expect(pedidoRepository.listarAbandonadosCriadosAntesDe).toHaveBeenCalledWith(
      new Date('2026-10-31T12:00:00Z'),
    );
  });

  it('cancela cada pedido abandonado e devolve quantos foram cancelados', async () => {
    pedidoRepository.listarAbandonadosCriadosAntesDe.mockResolvedValue([
      criarPedido('a', StatusPedido.CRIADO),
      criarPedido('b', StatusPedido.AGUARDANDO_PAGAMENTO),
    ]);

    const cancelados = await useCase.executar();

    expect(cancelados).toBe(2);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith('a', StatusPedido.CANCELADO);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith('b', StatusPedido.CANCELADO);
  });

  it('pula pedido em status que não pode ser cancelado pelo sistema, sem parar os outros', async () => {
    pedidoRepository.listarAbandonadosCriadosAntesDe.mockResolvedValue([
      // Não deveria vir do repositório, mas se vier (ex.: pago entre a consulta e
      // aqui), a máquina de estados barra.
      criarPedido('pago', StatusPedido.SEPARACAO),
      criarPedido('ok', StatusPedido.CRIADO),
    ]);

    const cancelados = await useCase.executar();

    expect(cancelados).toBe(1);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledTimes(1);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith('ok', StatusPedido.CANCELADO);
  });

  it('falha ao gravar um pedido não impede os próximos', async () => {
    pedidoRepository.listarAbandonadosCriadosAntesDe.mockResolvedValue([
      criarPedido('a', StatusPedido.CRIADO),
      criarPedido('b', StatusPedido.CRIADO),
    ]);
    pedidoRepository.atualizarStatus.mockRejectedValueOnce(new Error('banco fora'));

    const cancelados = await useCase.executar();

    expect(cancelados).toBe(1);
    expect(pedidoRepository.atualizarStatus).toHaveBeenCalledWith('b', StatusPedido.CANCELADO);
  });
});
