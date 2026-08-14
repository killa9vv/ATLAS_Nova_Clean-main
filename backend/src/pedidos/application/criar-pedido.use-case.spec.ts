// Testes do CriarPedidoUseCase, com foco na ordem de operações que evita
// overselling: o estoque precisa ser decrementado de forma atômica ANTES de
// o pedido ser persistido, e uma falha no decremento não pode deixar um
// pedido "fantasma" criado sem estoque reservado.
import { CriarPedidoUseCase } from './criar-pedido.use-case';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';
import { Carrinho, ItemPrecificado } from '../../carrinho/domain/item-precificado';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';

describe('CriarPedidoUseCase', () => {
  let montarCarrinhoUseCase: jest.Mocked<MontarCarrinhoUseCase>;
  let produtoRepository: jest.Mocked<ProdutoRepository>;
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let useCase: CriarPedidoUseCase;

  const carrinho = new Carrinho([new ItemPrecificado('produto-1', 'Detergente', 2, 10)]);

  beforeEach(() => {
    montarCarrinhoUseCase = {
      executar: jest.fn().mockResolvedValue(carrinho),
    } as unknown as jest.Mocked<MontarCarrinhoUseCase>;

    produtoRepository = {
      listarTodos: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorIds: jest.fn(),
      decrementarEstoque: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ProdutoRepository>;

    pedidoRepository = {
      criar: jest
        .fn()
        .mockResolvedValue(
          new Pedido('pedido-1', StatusPedido.CRIADO, [], 20, new Date(), new Date()),
        ),
      buscarPorId: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<PedidoRepository>;

    useCase = new CriarPedidoUseCase(montarCarrinhoUseCase, produtoRepository, pedidoRepository);
  });

  it('decrementa o estoque dos itens do carrinho antes de criar o pedido', async () => {
    const ordemDeChamadas: string[] = [];
    produtoRepository.decrementarEstoque.mockImplementation(async () => {
      ordemDeChamadas.push('decrementarEstoque');
    });
    pedidoRepository.criar.mockImplementation(async () => {
      ordemDeChamadas.push('pedidoRepository.criar');
      return new Pedido('pedido-1', StatusPedido.CRIADO, [], 20, new Date(), new Date());
    });

    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }]);

    expect(produtoRepository.decrementarEstoque).toHaveBeenCalledWith([
      { produtoId: 'produto-1', nome: 'Detergente', quantidade: 2, precoUnitario: 10 },
    ]);
    expect(ordemDeChamadas).toEqual(['decrementarEstoque', 'pedidoRepository.criar']);
  });

  it('não cria o pedido quando o decremento de estoque falha (corrida entre pedidos concorrentes)', async () => {
    produtoRepository.decrementarEstoque.mockRejectedValue(
      new EstoqueInsuficienteException('Detergente'),
    );

    await expect(
      useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }]),
    ).rejects.toBeInstanceOf(EstoqueInsuficienteException);
    expect(pedidoRepository.criar).not.toHaveBeenCalled();
  });

  it('persiste o pedido com os itens e o total calculados pelo carrinho', async () => {
    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }]);

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [{ produtoId: 'produto-1', nome: 'Detergente', quantidade: 2, precoUnitario: 10 }],
      carrinho.total,
    );
  });
});
