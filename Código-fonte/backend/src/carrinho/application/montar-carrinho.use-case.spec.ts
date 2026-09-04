// Testes do MontarCarrinhoUseCase: validação de itens solicitados contra o catálogo
// (existência e estoque) e cálculo de preços/total a partir do produto, nunca do cliente.
import { MontarCarrinhoUseCase } from './montar-carrinho.use-case';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../../produtos/domain/produtos.exceptions';
import { Produto } from '../../produtos/domain/produto.entity';
import { CupomRepository } from '../../cupons/domain/cupom.repository';
import { Cupom } from '../../cupons/domain/cupom.entity';
import { CupomInvalidoException } from '../../cupons/domain/cupons.exceptions';
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

function criarCupom(overrides: Partial<Cupom> = {}): Cupom {
  return new Cupom(
    overrides.id ?? 'cupom-1',
    overrides.codigo ?? 'DESCONTO10',
    overrides.tipoDesconto ?? 'PERCENTUAL',
    overrides.valor ?? 10,
    overrides.ativo ?? true,
    overrides.usosCount ?? 0,
    overrides.createdAt ?? new Date(),
    overrides.validoAte,
    overrides.usoMaximo,
  );
}

describe('MontarCarrinhoUseCase', () => {
  let produtoRepository: jest.Mocked<ProdutoRepository>;
  let cupomRepository: jest.Mocked<CupomRepository>;
  let useCase: MontarCarrinhoUseCase;

  beforeEach(() => {
    produtoRepository = {
      listarTodos: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorIds: jest.fn(),
      decrementarEstoque: jest.fn(),
    } as unknown as jest.Mocked<ProdutoRepository>;

    cupomRepository = {
      buscarPorCodigo: jest.fn(),
    } as unknown as jest.Mocked<CupomRepository>;

    useCase = new MontarCarrinhoUseCase(produtoRepository, cupomRepository);
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

  it('consolida quantidades do mesmo produto pedido em mais de uma linha', async () => {
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ id: 'produto-1', nome: 'Detergente', preco: 10, estoque: 5 }),
    ]);

    const carrinho = await useCase.executar([
      { produtoId: 'produto-1', quantidade: 2 },
      { produtoId: 'produto-1', quantidade: 2 },
    ]);

    // buscarPorIds só deve ser chamado com o id deduplicado, não duas vezes.
    expect(produtoRepository.buscarPorIds).toHaveBeenCalledWith(['produto-1']);
    expect(carrinho.itens).toHaveLength(1);
    expect(carrinho.itens[0]).toMatchObject({ produtoId: 'produto-1', quantidade: 4 });
    expect(carrinho.total).toBe(40);
  });

  it('lança EstoqueInsuficienteException quando o mesmo produto em duas linhas excede o estoque somado', async () => {
    // Estoque 5: cada linha isolada (3) "caberia", mas juntas (6) excedem.
    // Sem consolidar antes de validar, esse caso passaria pela checagem por engano.
    produtoRepository.buscarPorIds.mockResolvedValue([
      criarProduto({ id: 'produto-1', nome: 'Detergente', estoque: 5 }),
    ]);

    await expect(
      useCase.executar([
        { produtoId: 'produto-1', quantidade: 3 },
        { produtoId: 'produto-1', quantidade: 3 },
      ]),
    ).rejects.toBeInstanceOf(EstoqueInsuficienteException);
  });

  describe('cupom', () => {
    it('sem cupomCodigo, desconto fica 0 e cupomCodigo undefined', async () => {
      produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ preco: 10 })]);

      const carrinho = await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }]);

      expect(carrinho.desconto).toBe(0);
      expect(carrinho.cupomCodigo).toBeUndefined();
      expect(cupomRepository.buscarPorCodigo).not.toHaveBeenCalled();
    });

    it('aplica cupom PERCENTUAL válido sobre o total dos itens', async () => {
      produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ preco: 10 })]);
      cupomRepository.buscarPorCodigo.mockResolvedValue(
        criarCupom({ codigo: 'DESCONTO10', tipoDesconto: 'PERCENTUAL', valor: 10 }),
      );

      const carrinho = await useCase.executar(
        [{ produtoId: 'produto-1', quantidade: 2 }],
        'DESCONTO10',
      );

      expect(carrinho.total).toBe(20);
      expect(carrinho.desconto).toBe(2);
      expect(carrinho.cupomCodigo).toBe('DESCONTO10');
    });

    it('cupom VALOR_FIXO maior que o total nunca deixa o desconto passar do total', async () => {
      produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ preco: 10 })]);
      cupomRepository.buscarPorCodigo.mockResolvedValue(
        criarCupom({ codigo: 'FRETE50', tipoDesconto: 'VALOR_FIXO', valor: 50 }),
      );

      const carrinho = await useCase.executar(
        [{ produtoId: 'produto-1', quantidade: 1 }],
        'FRETE50',
      );

      expect(carrinho.total).toBe(10);
      expect(carrinho.desconto).toBe(10);
    });

    it('lança CupomInvalidoException quando o código não existe', async () => {
      produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ preco: 10 })]);
      cupomRepository.buscarPorCodigo.mockResolvedValue(null);

      await expect(
        useCase.executar([{ produtoId: 'produto-1', quantidade: 1 }], 'INEXISTENTE'),
      ).rejects.toBeInstanceOf(CupomInvalidoException);
    });

    it('lança CupomInvalidoException quando o cupom está inativo', async () => {
      produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ preco: 10 })]);
      cupomRepository.buscarPorCodigo.mockResolvedValue(criarCupom({ ativo: false }));

      await expect(
        useCase.executar([{ produtoId: 'produto-1', quantidade: 1 }], 'DESCONTO10'),
      ).rejects.toBeInstanceOf(CupomInvalidoException);
    });

    it('lança CupomInvalidoException quando o cupom expirou', async () => {
      produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ preco: 10 })]);
      cupomRepository.buscarPorCodigo.mockResolvedValue(
        criarCupom({ validoAte: new Date('2020-01-01') }),
      );

      await expect(
        useCase.executar([{ produtoId: 'produto-1', quantidade: 1 }], 'DESCONTO10'),
      ).rejects.toBeInstanceOf(CupomInvalidoException);
    });

    it('lança CupomInvalidoException quando o cupom já atingiu o usoMaximo', async () => {
      produtoRepository.buscarPorIds.mockResolvedValue([criarProduto({ preco: 10 })]);
      cupomRepository.buscarPorCodigo.mockResolvedValue(criarCupom({ usoMaximo: 5, usosCount: 5 }));

      await expect(
        useCase.executar([{ produtoId: 'produto-1', quantidade: 1 }], 'DESCONTO10'),
      ).rejects.toBeInstanceOf(CupomInvalidoException);
    });
  });
});
