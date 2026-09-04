import { LimparCarrinhoUseCase } from './limpar-carrinho.use-case';
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { CarrinhoSessao } from '../domain/carrinho-sessao';

describe('LimparCarrinhoUseCase', () => {
  let resolverCarrinhoSessaoUseCase: jest.Mocked<ResolverCarrinhoSessaoUseCase>;
  let carrinhoSessaoRepository: jest.Mocked<CarrinhoSessaoRepository>;
  let useCase: LimparCarrinhoUseCase;

  beforeEach(() => {
    resolverCarrinhoSessaoUseCase = {
      executar: jest.fn(),
    } as unknown as jest.Mocked<ResolverCarrinhoSessaoUseCase>;

    carrinhoSessaoRepository = {
      limpar: jest.fn(),
    } as unknown as jest.Mocked<CarrinhoSessaoRepository>;

    useCase = new LimparCarrinhoUseCase(resolverCarrinhoSessaoUseCase, carrinhoSessaoRepository);
  });

  it('é um no-op quando não existe carrinho pra essa sessão', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: undefined,
      sessionTokenNovo: undefined,
    });

    const resultado = await useCase.executar('token-inexistente', undefined);

    expect(resultado).toBe('token-inexistente');
    expect(carrinhoSessaoRepository.limpar).not.toHaveBeenCalled();
  });

  it('limpa os itens do carrinho resolvido — usado depois que um pedido é criado', async () => {
    resolverCarrinhoSessaoUseCase.executar.mockResolvedValue({
      carrinho: new CarrinhoSessao('carrinho-1', 'token-1', undefined, []),
      sessionTokenNovo: undefined,
    });

    const resultado = await useCase.executar('token-1', undefined);

    expect(carrinhoSessaoRepository.limpar).toHaveBeenCalledWith('carrinho-1');
    expect(resultado).toBe('token-1');
  });
});
