// Testes do PrismaProdutoRepository, focados no decremento atômico de estoque:
// cada item usa um UPDATE condicional (estoque >= quantidade) dentro de uma
// transação, e a falha em qualquer item deve abortar a transação inteira —
// sem decremento parcial.
import { PrismaProdutoRepository } from './prisma-produto.repository';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';

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
