import { AdicionarItemCarrinhoUseCase } from './adicionar-item-carrinho.use-case';
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../../produtos/domain/produtos.exceptions';
import { Produto } from '../../produtos/domain/produto.entity';
import { CarrinhoSessao } from '../domain/carrinho-sessao';

function criarProduto(overrides: Partial<Produto> = {}): Produto {
  return new Produto(
    overrides.id ?? 'produto-1',
    overrides.nome ?? 'Detergente',
    overrides.slug ?? 'detergente',
    overrides.preco ?? 10,
    overrides.estoque ?? 5,
    overrides.ativo ?? true,
  );
}

describe('AdicionarItemCarrinhoUseCase', () => {
  let resolverCarrinhoSessaoUseCase: jest.Mocked<ResolverCarrinhoSessaoUseCase>;
  let carrinhoSessaoRepository: jest.Mocked<CarrinhoSessaoRepository>;
  let produtoRepository: jest.Mocked<ProdutoRepository>;
  let useCase: AdicionarItemCarrinhoUseCase;

  beforeEach(() => {
    resolverCarrinhoSessaoUseCase = {
      executar: jest.fn(),
    } as unknown as jest.Mocked<ResolverCarrinhoSessaoUseCase>;

    carrinhoSessaoRepository = {
      upsertItem: jest.fn(),
    } as unknown as jest.Mocked<CarrinhoSessaoRepository>;

    produtoRepository = {
      buscarPorId: jest.fn(),
    } as unknown as jest.Mocked<ProdutoRepository>;

    useCase = new AdicionarItemCarrinhoUseCase(
      resolverCarrinhoSessaoUseCase,
      carrinhoSessaoRepository,
      produtoRepository,
    );
  });

  it('lança ProdutoNaoEncontradoException quando o produto não existe', async () => {
    produtoRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.executar(undefined, undefined, 'inexistente', 1)).rejects.toBeInstanceOf(
      ProdutoNaoEncontradoException,
    );
    expect(resolverCarrinhoSessaoUseCase.executar).not.toHaveBeenCalled();
  });

  it('lança ProdutoNaoEncontradoException quando o produto está inativo', async () => {
    produtoRepository.buscarPorId.mockResolvedValue(criarProduto({ ativo: false }));

    await expect(useCase.executar(undefined, undefined, 'produto-1', 1)).rejects.toBeInstanceOf(
      ProdutoNaoEncontradoException,
    );
  });

  it('não valida estoque ao adicionar — carrinho é referência viva, não reserva', async () => {
    produtoRepository.buscarPorId.mockResolvedValue(criarProduto({ estoque: 1 }));
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, []),
      sessionTokenNovo: undefined,
    });

    // Pede 10 com estoque real de só 1 — não deve lançar nada aqui.
    await expect(useCase.executar(undefined, undefined, 'produto-1', 10)).resolves.toBe('token-1');
  });

  it('resolve o carrinho com criarSeNaoExistir: true (find-or-create)', async () => {
    produtoRepository.buscarPorId.mockResolvedValue(criarProduto());
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, []),
      sessionTokenNovo: undefined,
    });

    await useCase.executar('token-anonimo', undefined, 'produto-1', 2);

    expect(resolverCarrinhoSessaoUseCase.executar).toHaveBeenCalledWith(
      'token-anonimo',
      undefined,
      true,
    );
  });

  it('faz upsert do item com a quantidade pedida no carrinho resolvido', async () => {
    produtoRepository.buscarPorId.mockResolvedValue(criarProduto());
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, []),
      sessionTokenNovo: undefined,
    });

    await useCase.executar(undefined, undefined, 'produto-1', 3);

    expect(carrinhoSessaoRepository.upsertItem).toHaveBeenCalledWith(
      'carrinho-1',
      'produto-1',
      3,
      expect.any(Date),
    );
  });

  it('devolve o sessionToken novo quando o carrinho acabou de ser criado', async () => {
    produtoRepository.buscarPorId.mockResolvedValue(criarProduto());
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-novo', 'token-gerado', undefined, []),
      sessionTokenNovo: 'token-gerado',
    });

    const resultado = await useCase.executar(undefined, undefined, 'produto-1', 1);

    expect(resultado).toBe('token-gerado');
  });
});
