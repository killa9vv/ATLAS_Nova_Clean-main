// Testes da leitura revalidada do carrinho: nunca cria carrinho (só leitura), e
// classifica cada item persistido contra o catálogo atual — disponível (com estoque
// parcial sinalizado, não removido), ou indisponível (produto sumido/inativo/zerado).
import { VisualizarCarrinhoUseCase } from './visualizar-carrinho.use-case';
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { Produto } from '../../produtos/domain/produto.entity';
import { CarrinhoSessao, ItemCarrinhoSessao } from '../domain/carrinho-sessao';

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

describe('VisualizarCarrinhoUseCase', () => {
  let resolverCarrinhoSessaoUseCase: jest.Mocked<ResolverCarrinhoSessaoUseCase>;
  let produtoRepository: jest.Mocked<ProdutoRepository>;
  let useCase: VisualizarCarrinhoUseCase;

  beforeEach(() => {
    resolverCarrinhoSessaoUseCase = {
      executar: jest.fn(),
    } as unknown as jest.Mocked<ResolverCarrinhoSessaoUseCase>;

    produtoRepository = {
      buscarPorIds: jest.fn(),
    } as unknown as jest.Mocked<ProdutoRepository>;

    useCase = new VisualizarCarrinhoUseCase(resolverCarrinhoSessaoUseCase, produtoRepository);
  });

  it('devolve carrinho vazio sem tocar o repositório de produtos quando nada é encontrado', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: undefined,
      sessionTokenNovo: undefined,
    });

    const resultado = await useCase.executar(undefined, undefined);

    expect(resultado).toEqual({
      sessionToken: undefined,
      itens: [],
      itensIndisponiveis: [],
      total: 0,
    });
    expect(produtoRepository.buscarPorIds).not.toHaveBeenCalled();
    expect(resolverCarrinhoSessaoUseCase.executar).toHaveBeenCalledWith(
      undefined,
      undefined,
      false,
    );
  });

  it('resolve com criarSeNaoExistir: false — leitura nunca cria carrinho', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: undefined,
      sessionTokenNovo: undefined,
    });

    await useCase.executar('token-1', 'cliente-1');

    expect(resolverCarrinhoSessaoUseCase.executar).toHaveBeenCalledWith(
      'token-1',
      'cliente-1',
      false,
    );
  });

  it('marca item de produto inativo como PRODUTO_INDISPONIVEL, sem remover do carrinho', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, [
        new ItemCarrinhoSessao('produto-1', 2),
      ]),
      sessionTokenNovo: undefined,
    });
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ nome: 'Detergente', ativo: false }),
    ]);

    const resultado = await useCase.executar('token-1', undefined);

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.itensIndisponiveis).toEqual([
      { produtoId: 'produto-1', nome: 'Detergente', motivo: 'PRODUTO_INDISPONIVEL' },
    ]);
  });

  it('marca item de produto sem estoque como SEM_ESTOQUE', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, [
        new ItemCarrinhoSessao('produto-1', 2),
      ]),
      sessionTokenNovo: undefined,
    });
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ nome: 'Detergente', estoque: 0 }),
    ]);

    const resultado = await useCase.executar('token-1', undefined);

    expect(resultado.itensIndisponiveis).toEqual([
      { produtoId: 'produto-1', nome: 'Detergente', motivo: 'SEM_ESTOQUE' },
    ]);
  });

  it('produto removido do catálogo (id não encontrado) também vira PRODUTO_INDISPONIVEL', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, [
        new ItemCarrinhoSessao('produto-removido', 1),
      ]),
      sessionTokenNovo: undefined,
    });
    produtoRepository.buscarPorIds.mockResolvedValue([]);

    const resultado = await useCase.executar('token-1', undefined);

    expect(resultado.itensIndisponiveis).toEqual([
      { produtoId: 'produto-removido', nome: undefined, motivo: 'PRODUTO_INDISPONIVEL' },
    ]);
  });

  it('estoque parcial continua em itens (disponivel:true) com estoqueDisponivel correto, não vai pra itensIndisponiveis', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, [
        new ItemCarrinhoSessao('produto-1', 5),
      ]),
      sessionTokenNovo: undefined,
    });
    produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ estoque: 2 })]);

    const resultado = await useCase.executar('token-1', undefined);

    expect(resultado.itensIndisponiveis).toEqual([]);
    expect(resultado.itens).toEqual([
      expect.objectContaining({
        produtoId: 'produto-1',
        quantidade: 5,
        disponivel: false,
        estoqueDisponivel: 2,
      }),
    ]);
  });

  it('calcula subtotal/total só a partir do preço atual do catálogo, ignorando qualquer coisa salva no item', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, [
        new ItemCarrinhoSessao('produto-1', 2),
        new ItemCarrinhoSessao('produto-2', 1),
      ]),
      sessionTokenNovo: undefined,
    });
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ id: 'produto-1', preco: 10, estoque: 5 }),
      criarProduto({ id: 'produto-2', preco: 25.9, estoque: 5 }),
    ]);

    const resultado = await useCase.executar('token-1', undefined);

    expect(resultado.itens[0].subtotal).toBe(20);
    expect(resultado.total).toBe(45.9);
  });

  it('total soma só itens disponíveis, ignorando os indisponíveis', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, [
        new ItemCarrinhoSessao('produto-1', 2),
        new ItemCarrinhoSessao('produto-2', 1),
      ]),
      sessionTokenNovo: undefined,
    });
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ id: 'produto-1', preco: 10, estoque: 5 }),
      criarProduto({ id: 'produto-2', preco: 25.9, ativo: false }),
    ]);

    const resultado = await useCase.executar('token-1', undefined);

    expect(resultado.total).toBe(20);
  });

  it('repassa o sessionToken do carrinho resolvido na resposta', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-existente', undefined, []),
      sessionTokenNovo: undefined,
    });

    const resultado = await useCase.executar('token-existente', undefined);

    expect(resultado.sessionToken).toBe('token-existente');
  });
});
