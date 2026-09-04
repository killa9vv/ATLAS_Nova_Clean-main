import { RemoverItemCarrinhoUseCase } from './remover-item-carrinho.use-case';
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { CarrinhoSessao } from '../domain/carrinho-sessao';

describe('RemoverItemCarrinhoUseCase', () => {
  let resolverCarrinhoSessaoUseCase: jest.Mocked<ResolverCarrinhoSessaoUseCase>;
  let carrinhoSessaoRepository: jest.Mocked<CarrinhoSessaoRepository>;
  let useCase: RemoverItemCarrinhoUseCase;

  beforeEach(() => {
    resolverCarrinhoSessaoUseCase = {
      executar: jest.fn(),
    } as unknown as jest.Mocked<ResolverCarrinhoSessaoUseCase>;

    carrinhoSessaoRepository = {
      removerItem: jest.fn(),
    } as unknown as jest.Mocked<CarrinhoSessaoRepository>;

    useCase = new RemoverItemCarrinhoUseCase(
      resolverCarrinhoSessaoUseCase,
      carrinhoSessaoRepository,
    );
  });

  it('é um no-op quando não existe carrinho pra essa sessão', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: undefined,
      sessionTokenNovo: undefined,
    });

    const resultado = await useCase.executar('token-inexistente', undefined, 'produto-1');

    expect(resultado).toBe('token-inexistente');
    expect(carrinhoSessaoRepository.removerItem).not.toHaveBeenCalled();
  });

  it('remove o item do carrinho resolvido', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, []),
      sessionTokenNovo: undefined,
    });

    const resultado = await useCase.executar('token-1', undefined, 'produto-1');

    expect(carrinhoSessaoRepository.removerItem).toHaveBeenCalledWith('carrinho-1', 'produto-1');
    expect(resultado).toBe('token-1');
  });
});
