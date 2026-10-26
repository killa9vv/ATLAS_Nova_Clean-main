// Testes do PrismaProdutoRepository, focados no decremento atômico de estoque:
// cada item usa um UPDATE condicional (estoque >= quantidade) dentro de uma
// transação, e a falha em qualquer item deve abortar a transação inteira —
// sem decremento parcial.
import { PrismaProdutoRepository } from './prisma-produto.repository';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';

describe('PrismaProdutoRepository.decrementarEstoque', () => {
  let updateManyMock: jest.Mock;
  let prisma: { $transaction: jest.Mock; produto: { updateMany: jest.Mock } };
  let repository: PrismaProdutoRepository;

  beforeEach(() => {
    updateManyMock = jest.fn();
    prisma = {
      produto: { updateMany: updateManyMock },
      // Simula o comportamento real do Prisma: executa o callback recebendo um
      // client "tx" (aqui, o próprio mock) e propaga qualquer erro lançado dentro dele.
      $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
    };

    repository = new PrismaProdutoRepository(prisma as unknown as PrismaService);
  });

  it('decrementa cada item com um UPDATE condicional ao estoque disponível', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });

    await repository.decrementarEstoque([
      { produtoId: 'produto-1', nome: 'Detergente', quantidade: 2 },
      { produtoId: 'produto-2', nome: 'Sabão em pó', quantidade: 1 },
    ]);

    expect(updateManyMock).toHaveBeenNthCalledWith(1, {
      where: { id: 'produto-1', estoque: { gte: 2 } },
      data: { estoque: { decrement: 2 } },
    });
    expect(updateManyMock).toHaveBeenNthCalledWith(2, {
      where: { id: 'produto-2', estoque: { gte: 1 } },
      data: { estoque: { decrement: 1 } },
    });
  });

  it('lança EstoqueInsuficienteException quando o UPDATE não atinge nenhuma linha (estoque insuficiente)', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });

    await expect(
      repository.decrementarEstoque([
        { produtoId: 'produto-1', nome: 'Detergente', quantidade: 10 },
      ]),
    ).rejects.toBeInstanceOf(EstoqueInsuficienteException);
  });

  it('não decrementa os itens seguintes quando um item anterior falha (tudo ou nada)', async () => {
    updateManyMock
      .mockResolvedValueOnce({ count: 0 }) // primeiro item: sem estoque suficiente
      .mockResolvedValueOnce({ count: 1 });

    await expect(
      repository.decrementarEstoque([
        { produtoId: 'produto-1', nome: 'Detergente', quantidade: 10 },
        { produtoId: 'produto-2', nome: 'Sabão em pó', quantidade: 1 },
      ]),
    ).rejects.toBeInstanceOf(EstoqueInsuficienteException);

    expect(updateManyMock).toHaveBeenCalledTimes(1);
  });
});

describe('PrismaProdutoRepository.listarMaisVendidos', () => {
  let groupByMock: jest.Mock;
  let findManyMock: jest.Mock;
  let repository: PrismaProdutoRepository;

  const produtoBase = {
    slug: 'produto',
    descricao: null,
    categoria: null,
    estoque: 10,
    ativo: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    pesoKg: null,
    alturaCm: null,
    larguraCm: null,
    comprimentoCm: null,
    pack: null,
    precoPromocional: null,
    marca: null,
    produtoTipo: null,
  };

  beforeEach(() => {
    groupByMock = jest.fn();
    findManyMock = jest.fn();
    const prisma = { itemPedido: { groupBy: groupByMock }, produto: { findMany: findManyMock } };
    repository = new PrismaProdutoRepository(prisma as unknown as PrismaService);
  });

  it('filtra por status que contam como venda e ordena pela quantidade agregada', async () => {
    groupByMock.mockResolvedValue([]);

    await repository.listarMaisVendidos(5);

    expect(groupByMock).toHaveBeenCalledWith({
      by: ['produtoId'],
      where: {
        pedido: {
          status: {
            in: [
              StatusPedido.PAGO,
              StatusPedido.SEPARACAO,
              StatusPedido.ENVIADO,
              StatusPedido.ENTREGUE,
            ],
          },
        },
      },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 10,
    });
  });

  it('devolve lista vazia sem consultar produtos quando não há nenhuma venda', async () => {
    groupByMock.mockResolvedValue([]);

    const resultado = await repository.listarMaisVendidos(5);

    expect(resultado).toEqual([]);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it('reordena os produtos pela posição no agregado (findMany não preserva ordem de "in")', async () => {
    groupByMock.mockResolvedValue([
      { produtoId: 'produto-2', _sum: { quantidade: 30 } },
      { produtoId: 'produto-1', _sum: { quantidade: 10 } },
    ]);
    // findMany devolve fora de ordem de propósito, pra provar que o repositório reordena.
    findManyMock.mockResolvedValue([
      { id: 'produto-1', nome: 'Produto 1', preco: 10, ...produtoBase },
      { id: 'produto-2', nome: 'Produto 2', preco: 20, ...produtoBase },
    ]);

    const resultado = await repository.listarMaisVendidos(5);

    expect(resultado.map((p) => p.id)).toEqual(['produto-2', 'produto-1']);
  });

  it('só busca produtos ativos e respeita o limite mesmo com folga maior no agregado', async () => {
    groupByMock.mockResolvedValue([
      { produtoId: 'produto-1', _sum: { quantidade: 30 } },
      { produtoId: 'produto-2', _sum: { quantidade: 20 } },
      { produtoId: 'produto-3', _sum: { quantidade: 10 } },
    ]);
    findManyMock.mockResolvedValue([
      { id: 'produto-1', nome: 'Produto 1', preco: 10, ...produtoBase },
      { id: 'produto-2', nome: 'Produto 2', preco: 20, ...produtoBase },
    ]);

    const resultado = await repository.listarMaisVendidos(2);

    expect(findManyMock).toHaveBeenCalledWith({
      where: { id: { in: ['produto-1', 'produto-2', 'produto-3'] }, ativo: true },
      include: { marca: true, produtoTipo: true, imagens: { where: { ordem: 0 }, take: 1 } },
    });
    expect(resultado).toHaveLength(2);
  });
});

// Cobre o fix do N+1: antes, cada ProductCard da listagem fazia sua própria chamada
// GET /produtos/:id/imagens — chegou a estourar rate-limit só carregando a home com
// ~20 cards. Agora a foto principal (ordem 0) vem no mesmo include/JOIN da listagem.
describe('PrismaProdutoRepository (foto principal embutida na listagem)', () => {
  let findUniqueMock: jest.Mock;
  let repository: PrismaProdutoRepository;

  beforeEach(() => {
    findUniqueMock = jest.fn();
    const prisma = { produto: { findUnique: findUniqueMock } };
    repository = new PrismaProdutoRepository(prisma as unknown as PrismaService);
  });

  const produtoBase = {
    id: 'produto-1',
    nome: 'Produto 1',
    slug: 'produto',
    preco: 10,
    descricao: null,
    categoria: null,
    estoque: 10,
    ativo: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    pesoKg: null,
    alturaCm: null,
    larguraCm: null,
    comprimentoCm: null,
    pack: null,
    precoPromocional: null,
    categoriaId: null,
    marca: null,
    produtoTipo: null,
  };

  it('busca a imagem já no mesmo include (where ordem 0, take 1 — sem query separada)', async () => {
    findUniqueMock.mockResolvedValue({ ...produtoBase, imagens: [] });

    await repository.buscarPorId('produto-1');

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { id: 'produto-1' },
      include: { marca: true, produtoTipo: true, imagens: { where: { ordem: 0 }, take: 1 } },
    });
  });

  it('mapeia imagens[0].url pra imagemPrincipalThumbnailUrl com a transformação Cloudinary', async () => {
    findUniqueMock.mockResolvedValue({
      ...produtoBase,
      imagens: [
        {
          id: 'img-1',
          produtoId: 'produto-1',
          url: 'https://res.cloudinary.com/sukxyjci/image/upload/v1/atlas-nova-clean/produtos/abc.webp',
          providerId: 'atlas-nova-clean/produtos/abc',
          ordem: 0,
        },
      ],
    });

    const resultado = await repository.buscarPorId('produto-1');

    expect(resultado?.imagemPrincipalThumbnailUrl).toBe(
      'https://res.cloudinary.com/sukxyjci/image/upload/w_300,h_300,c_limit,q_auto,f_auto/v1/atlas-nova-clean/produtos/abc.webp',
    );
  });

  it('fica undefined quando o produto não tem nenhuma imagem cadastrada', async () => {
    findUniqueMock.mockResolvedValue({ ...produtoBase, imagens: [] });

    const resultado = await repository.buscarPorId('produto-1');

    expect(resultado?.imagemPrincipalThumbnailUrl).toBeUndefined();
  });
});
