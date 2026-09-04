// Testes do coração do carrinho persistido: qual carrinho corresponde a uma
// requisição (por cliente logado, por sessionToken anônimo, ou nenhum), quando criar
// um novo, e a regra de "adoção" (carrinho anônimo passa a ser do cliente ao logar,
// só quando ele ainda não tem um carrinho próprio — nunca funde dois existentes).
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { CarrinhoSessao } from '../domain/carrinho-sessao';

function criarCarrinho(overrides: Partial<CarrinhoSessao> = {}): CarrinhoSessao {
  return new CarrinhoSessao(
    overrides.id ?? 'carrinho-1',
    overrides.sessionToken ?? 'token-existente',
    overrides.clienteId,
    overrides.itens ?? [],
    overrides.expiraEm,
  );
}

describe('ResolverCarrinhoSessaoUseCase', () => {
  let carrinhoSessaoRepository: jest.Mocked<CarrinhoSessaoRepository>;
  let useCase: ResolverCarrinhoSessaoUseCase;

  beforeEach(() => {
    carrinhoSessaoRepository = {
      buscarPorSessionToken: jest.fn(),
      buscarPorClienteId: jest.fn(),
      criar: jest.fn(),
      adotarPorCliente: jest.fn(),
      upsertItem: jest.fn(),
      definirQuantidadeItem: jest.fn(),
      removerItem: jest.fn(),
      limpar: jest.fn(),
      deletarExpirados: jest.fn(),
    } as unknown as jest.Mocked<CarrinhoSessaoRepository>;

    useCase = new ResolverCarrinhoSessaoUseCase(carrinhoSessaoRepository);
  });

  it('devolve undefined sem criar quando nada é encontrado e criarSeNaoExistir é false', async () => {
    const resultado = await useCase.executar(undefined, undefined, false);

    expect(resultado).toEqual({ carrinho: undefined, sessionTokenNovo: undefined });
    expect(carrinhoSessaoRepository.criar).not.toHaveBeenCalled();
  });

  it('busca por clienteId com prioridade sobre sessionToken', async () => {
    const carrinhoDoCliente = criarCarrinho({ id: 'carrinho-cliente', clienteId: 'cliente-1' });
    carrinhoSessaoRepository.buscarPorClienteId.mockResolvedValue(carrinhoDoCliente);

    const resultado = await useCase.executar('token-anonimo', 'cliente-1', false);

    expect(resultado.carrinho).toBe(carrinhoDoCliente);
    expect(carrinhoSessaoRepository.buscarPorSessionToken).not.toHaveBeenCalled();
  });

  it('busca por sessionToken quando não há clienteId', async () => {
    const carrinhoAnonimo = criarCarrinho({ id: 'carrinho-anon' });
    carrinhoSessaoRepository.buscarPorSessionToken.mockResolvedValue(carrinhoAnonimo);

    const resultado = await useCase.executar('token-anonimo', undefined, false);

    expect(resultado.carrinho).toBe(carrinhoAnonimo);
    expect(carrinhoSessaoRepository.buscarPorClienteId).not.toHaveBeenCalled();
  });

  it('adota o carrinho anônimo quando o cliente loga e ainda não tem carrinho próprio', async () => {
    carrinhoSessaoRepository.buscarPorClienteId.mockResolvedValue(null);
    const carrinhoAnonimo = criarCarrinho({ id: 'carrinho-anon', clienteId: undefined });
    carrinhoSessaoRepository.buscarPorSessionToken.mockResolvedValue(carrinhoAnonimo);

    const resultado = await useCase.executar('token-anonimo', 'cliente-1', false);

    expect(carrinhoSessaoRepository.adotarPorCliente).toHaveBeenCalledWith(
      'carrinho-anon',
      'cliente-1',
    );
    expect(resultado.carrinho).toBe(carrinhoAnonimo);
  });

  it('não adota (nem funde) quando o cliente já tem um carrinho próprio', async () => {
    const carrinhoDoCliente = criarCarrinho({ id: 'carrinho-cliente', clienteId: 'cliente-1' });
    carrinhoSessaoRepository.buscarPorClienteId.mockResolvedValue(carrinhoDoCliente);

    const resultado = await useCase.executar('token-anonimo', 'cliente-1', false);

    expect(resultado.carrinho).toBe(carrinhoDoCliente);
    expect(carrinhoSessaoRepository.buscarPorSessionToken).not.toHaveBeenCalled();
    expect(carrinhoSessaoRepository.adotarPorCliente).not.toHaveBeenCalled();
  });

  it('cria um carrinho novo quando criarSeNaoExistir é true e nada foi encontrado', async () => {
    const carrinhoCriado = criarCarrinho({ id: 'carrinho-novo' });
    carrinhoSessaoRepository.criar.mockResolvedValue(carrinhoCriado);

    const resultado = await useCase.executar(undefined, undefined, true);

    expect(carrinhoSessaoRepository.criar).toHaveBeenCalledTimes(1);
    const [tokenGerado, clienteIdPassado] = carrinhoSessaoRepository.criar.mock.calls[0];
    expect(tokenGerado).toMatch(/^[0-9a-f]{64}$/);
    expect(clienteIdPassado).toBeUndefined();
    expect(resultado.carrinho).toBe(carrinhoCriado);
    expect(resultado.sessionTokenNovo).toBe(tokenGerado);
  });

  it('nunca reaproveita um sessionToken recebido mas não encontrado no banco', async () => {
    carrinhoSessaoRepository.buscarPorSessionToken.mockResolvedValue(null);
    carrinhoSessaoRepository.criar.mockResolvedValue(criarCarrinho({ id: 'carrinho-novo' }));

    await useCase.executar('token-morto-ou-expirado', undefined, true);

    const [tokenGerado] = carrinhoSessaoRepository.criar.mock.calls[0];
    expect(tokenGerado).not.toBe('token-morto-ou-expirado');
  });

  it('cria já vinculado ao clienteId quando a requisição é de um cliente logado sem carrinho', async () => {
    carrinhoSessaoRepository.buscarPorClienteId.mockResolvedValue(null);
    carrinhoSessaoRepository.criar.mockResolvedValue(
      criarCarrinho({ id: 'carrinho-novo', clienteId: 'cliente-1' }),
    );

    await useCase.executar(undefined, 'cliente-1', true);

    const [, clienteIdPassado] = carrinhoSessaoRepository.criar.mock.calls[0];
    expect(clienteIdPassado).toBe('cliente-1');
  });
});
