// Testes do MontarCarrinhoUseCase: validação de itens solicitados contra o catálogo
// (existência e estoque) e cálculo de preços/total a partir do produto, nunca do cliente.
import { MontarCarrinhoUseCase } from './montar-carrinho.use-case';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../../produtos/domain/produtos.exceptions';
import { Produto } from '../../produtos/domain/produto.entity';
import {
  CarrinhoVazioException,
  EstoqueInsuficienteException,
} from '../domain/carrinho.exceptions';

function criarProduto(overrides: Partial<Produto> = {}): Produto {
  return new Produto(
    overrides.id ?? 'produto-1',
    overrides.nome ?? 'Detergente',
    overrides.slug ?? 'detergente',
    overrides.preco ?? 10,
    overrides.estoque ?? 5,
    overrides.ativo ?? true,
    overrides.descricao,
    overrides.categoria,
  );
}

describe('MontarCarrinhoUseCase', () => {
  let produtoRepository: jest.Mocked<ProdutoRepository>;
  let useCase: MontarCarrinhoUseCase;

  beforeEach(() => {
    produtoRepository = {
      listarTodos: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorIds: jest.fn(),
      decrementarEstoque: jest.fn(),
    } as unknown as jest.Mocked<ProdutoRepository>;

    useCase = new MontarCarrinhoUseCase(produtoRepository);
  });

  it('lança CarrinhoVazioException quando não há itens solicitados', async () => {
    await expect(useCase.executar([])).rejects.toBeInstanceOf(CarrinhoVazioException);
    expect(produtoRepository.buscarPorIds).not.toHaveBeenCalled();
  });

  it('lança ProdutoNaoEncontradoException quando um produto solicitado não existe no catálogo', async () => {
    produtoRepository.buscarPorIds.mockResolvedValue([]);

    await expect(
      useCase.executar([{ produtoId: 'inexistente', quantidade: 1 }]),
    ).rejects.toBeInstanceOf(ProdutoNaoEncontradoException);
  });

  it('lança EstoqueInsuficienteException quando a quantidade pedida excede o estoque', async () => {
    produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ estoque: 2 })]);

    await expect(
      useCase.executar([{ produtoId: 'produto-1', quantidade: 3 }]),
    ).rejects.toBeInstanceOf(EstoqueInsuficienteException);
  });

  it('monta o carrinho com preço vindo do catálogo, ignorando qualquer preço do cliente', async () => {
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ id: 'produto-1', nome: 'Detergente', preco: 10, estoque: 5 }),
      criarProduto({ id: 'produto-2', nome: 'Sabão em pó', preco: 25.9, estoque: 5 }),
    ]);

    const carrinho = await useCase.executar([
      { produtoId: 'produto-1', quantidade: 2 },
      { produtoId: 'produto-2', quantidade: 1 },
    ]);

    expect(carrinho.itens).toHaveLength(2);
    expect(carrinho.itens[0]).toMatchObject({
      produtoId: 'produto-1',
      quantidade: 2,
      precoUnitario: 10,
    });
    expect(carrinho.total).toBe(45.9);
  });
});
