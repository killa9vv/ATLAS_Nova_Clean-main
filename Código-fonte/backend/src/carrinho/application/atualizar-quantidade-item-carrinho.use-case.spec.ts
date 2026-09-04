import { AtualizarQuantidadeItemCarrinhoUseCase } from './atualizar-quantidade-item-carrinho.use-case';
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { CarrinhoSessao } from '../domain/carrinho-sessao';

describe('AtualizarQuantidadeItemCarrinhoUseCase', () => {
  let resolverCarrinhoSessaoUseCase: jest.Mocked<ResolverCarrinhoSessaoUseCase>;
  let carrinhoSessaoRepository: jest.Mocked<CarrinhoSessaoRepository>;
  let useCase: AtualizarQuantidadeItemCarrinhoUseCase;

  beforeEach(() => {
    resolverCarrinhoSessaoUseCase = {
      executar: jest.fn(),
    } as unknown as jest.Mocked<ResolverCarrinhoSessaoUseCase>;

    carrinhoSessaoRepository = {
      definirQuantidadeItem: jest.fn(),
      removerItem: jest.fn(),
    } as unknown as jest.Mocked<CarrinhoSessaoRepository>;

    useCase = new AtualizarQuantidadeItemCarrinhoUseCase(
      resolverCarrinhoSessaoUseCase,
      carrinhoSessaoRepository,
    );
  });

  it('é um no-op (devolve o sessionToken recebido) quando não existe carrinho pra essa sessão', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: undefined,
      sessionTokenNovo: undefined,
    });

    const resultado = await useCase.executar('token-inexistente', undefined, 'produto-1', 3);

    expect(resultado).toBe('token-inexistente');
    expect(carrinhoSessaoRepository.definirQuantidadeItem).not.toHaveBeenCalled();
    expect(carrinhoSessaoRepository.removerItem).not.toHaveBeenCalled();
  });

  it('resolve sem criar carrinho (criarSeNaoExistir: false)', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: undefined,
      sessionTokenNovo: undefined,
    });

    await useCase.executar('token-1', undefined, 'produto-1', 3);

    expect(resolverCarrinhoSessaoUseCase.executar).toHaveBeenCalledWith(
      'token-1',
      undefined,
      false,
    );
  });

  it('define a quantidade absoluta (não incrementa) quando > 0', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, []),
      sessionTokenNovo: undefined,
    });

    await useCase.executar('token-1', undefined, 'produto-1', 5);

    expect(carrinhoSessaoRepository.definirQuantidadeItem).toHaveBeenCalledWith(
      'carrinho-1',
      'produto-1',
      5,
      expect.any(Date),
    );
    expect(carrinhoSessaoRepository.removerItem).not.toHaveBeenCalled();
  });

  it('remove o item quando a quantidade é 0', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, []),
      sessionTokenNovo: undefined,
    });

    await useCase.executar('token-1', undefined, 'produto-1', 0);

    expect(carrinhoSessaoRepository.removerItem).toHaveBeenCalledWith('carrinho-1', 'produto-1');
    expect(carrinhoSessaoRepository.definirQuantidadeItem).not.toHaveBeenCalled();
  });
});
