import { Produto } from '../../produtos/domain/produto.entity';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { Pedido, ItemPedidoEntity } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';
import { PedidoNaoEncontradoException } from '../domain/pedidos.exceptions';
import { BuscarPedidoDoClienteUseCase } from './buscar-pedido-do-cliente.use-case';
import { RepetirPedidoUseCase } from './repetir-pedido.use-case';

function criarProdutoRepositoryMock(): jest.Mocked<ProdutoRepository> {
  return {
    listarTodos: jest.fn(),
    listarComFiltros: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorIds: jest.fn(),
    buscarPorSlug: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
  } as unknown as jest.Mocked<ProdutoRepository>;
}

function criarProduto(overrides: Partial<Produto> = {}): Produto {
  return new Produto(
    overrides.id ?? 'prod-1',
    overrides.nome ?? 'Detergente',
    overrides.slug ?? 'detergente',
    overrides.preco ?? 12.5,
    overrides.estoque ?? 10,
    overrides.ativo ?? true,
  );
}

function criarPedido(itens: ItemPedidoEntity[], clienteId = 'cli-1'): Pedido {
  return new Pedido(
    'pedido-1',
    '2026-000001',
    StatusPedido.PAGO,
    itens,
    100,
    'ENTREGA',
    10,
    new Date(),
    new Date(),
    undefined,
    undefined,
    { nome: 'Maria' },
    clienteId,
  );
}

describe('RepetirPedidoUseCase', () => {
  function montar(pedido: Pedido | null) {
    const pedidoRepository = { buscarPorId: jest.fn().mockResolvedValue(pedido) } as any;
    const buscarPedidoDoClienteUseCase = new BuscarPedidoDoClienteUseCase(pedidoRepository);
    const produtoRepository = criarProdutoRepositoryMock();
    const useCase = new RepetirPedidoUseCase(buscarPedidoDoClienteUseCase, produtoRepository);
    return { useCase, produtoRepository };
  }

  it('produto disponível com estoque suficiente entra normal, com preço ATUAL (não o snapshot antigo)', async () => {
    const pedido = criarPedido([
      new ItemPedidoEntity('prod-1', 'Detergente (nome antigo)', 2, 9.99),
    ]);
    const { useCase, produtoRepository } = montar(pedido);
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ id: 'prod-1', preco: 15.9, estoque: 20 }),
    ]);

    const resultado = await useCase.executar('pedido-1', 'cli-1');

    expect(resultado.itens).toEqual([
      {
        produtoId: 'prod-1',
        nome: 'Detergente',
        quantidade: 2,
        precoUnitario: 15.9,
        ajustado: false,
      },
    ]);
    expect(resultado.itensIndisponiveis).toHaveLength(0);
  });

  it('produto que não existe mais entra em itensIndisponiveis (PRODUTO_INDISPONIVEL)', async () => {
    const pedido = criarPedido([new ItemPedidoEntity('prod-removido', 'Produto Removido', 1, 5)]);
    const { useCase, produtoRepository } = montar(pedido);
    produtoRepository.buscarPorIds.mockResolvedValue([]);

    const resultado = await useCase.executar('pedido-1', 'cli-1');

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.itensIndisponiveis).toEqual([
      { produtoId: 'prod-removido', nome: 'Produto Removido', motivo: 'PRODUTO_INDISPONIVEL' },
    ]);
  });

  it('produto desativado entra em itensIndisponiveis mesmo que ainda exista', async () => {
    const pedido = criarPedido([new ItemPedidoEntity('prod-1', 'Detergente', 1, 10)]);
    const { useCase, produtoRepository } = montar(pedido);
    produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ ativo: false })]);

    const resultado = await useCase.executar('pedido-1', 'cli-1');

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.itensIndisponiveis[0].motivo).toBe('PRODUTO_INDISPONIVEL');
  });

  it('produto sem estoque nenhum entra em itensIndisponiveis (SEM_ESTOQUE)', async () => {
    const pedido = criarPedido([new ItemPedidoEntity('prod-1', 'Detergente', 3, 10)]);
    const { useCase, produtoRepository } = montar(pedido);
    produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ estoque: 0 })]);

    const resultado = await useCase.executar('pedido-1', 'cli-1');

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.itensIndisponiveis[0].motivo).toBe('SEM_ESTOQUE');
  });

  it('estoque parcial ajusta a quantidade em vez de bloquear (ajustado: true)', async () => {
    const pedido = criarPedido([new ItemPedidoEntity('prod-1', 'Detergente', 5, 10)]);
    const { useCase, produtoRepository } = montar(pedido);
    produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ estoque: 2 })]);

    const resultado = await useCase.executar('pedido-1', 'cli-1');

    expect(resultado.itens).toEqual([
      {
        produtoId: 'prod-1',
        nome: 'Detergente',
        quantidade: 2,
        precoUnitario: 12.5,
        ajustado: true,
      },
    ]);
    expect(resultado.itensIndisponiveis).toHaveLength(0);
  });

  it('não permite repetir pedido de outro cliente (mesmo erro de "não encontrado")', async () => {
    const pedido = criarPedido(
      [new ItemPedidoEntity('prod-1', 'Detergente', 1, 10)],
      'outro-cliente',
    );
    const { useCase } = montar(pedido);

    await expect(useCase.executar('pedido-1', 'cli-1')).rejects.toBeInstanceOf(
      PedidoNaoEncontradoException,
    );
  });

  it('pedido inexistente lança PedidoNaoEncontradoException', async () => {
    const { useCase } = montar(null);

    await expect(useCase.executar('pedido-inexistente', 'cli-1')).rejects.toBeInstanceOf(
      PedidoNaoEncontradoException,
    );
  });
});
