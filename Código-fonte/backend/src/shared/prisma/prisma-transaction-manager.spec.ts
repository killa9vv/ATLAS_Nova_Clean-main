// Implementação concreta da porta TransactionManager. O detalhe que importa pra
// confiabilidade é o repasse do client transacional (`tx`) pro callback: se ele
// repassasse o PrismaService normal, cada repositório abriria sua própria conexão
// e o "tudo ou nada" sumiria silenciosamente — nenhum erro, só pedido criado sem
// estoque decrementado. Os testes travam esse repasse e a propagação de falhas
// (que é o que dispara o rollback do lado do Prisma).
import { PrismaTransactionManager } from './prisma-transaction-manager';
import { PrismaService } from './prisma.service';
import { TransactionManager } from './transaction-manager';

describe('PrismaTransactionManager', () => {
  let prisma: { $transaction: jest.Mock };
  let manager: PrismaTransactionManager;

  /** Faz o papel do client transacional que o Prisma entrega ao callback. */
  const contextoTransacional = { marcador: 'client-transacional' };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((fn: (contexto: unknown) => Promise<unknown>) =>
        fn(contextoTransacional),
      ),
    };

    manager = new PrismaTransactionManager(prisma as unknown as PrismaService);
  });

  it('implementa a porta TransactionManager', () => {
    expect(manager).toBeInstanceOf(TransactionManager);
  });

  it('executa o callback dentro de $transaction e devolve o resultado', async () => {
    const fn = jest.fn().mockResolvedValue({ pedidoId: 'pedido-1' });

    await expect(manager.executar(fn)).resolves.toEqual({ pedidoId: 'pedido-1' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('repassa o client transacional pro callback, não o PrismaService', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);

    await manager.executar(fn);

    expect(fn).toHaveBeenCalledWith(contextoTransacional);
    expect(fn).not.toHaveBeenCalledWith(prisma);
  });

  it('abre uma transação por chamada, sem reaproveitar contexto entre elas', async () => {
    await manager.executar(jest.fn().mockResolvedValue(1));
    await manager.executar(jest.fn().mockResolvedValue(2));

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('propaga a rejeição do callback para o Prisma desfazer a transação', async () => {
    const falha = new Error('Estoque insuficiente para o produto Detergente.');
    const fn = jest.fn().mockRejectedValue(falha);

    await expect(manager.executar(fn)).rejects.toBe(falha);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('propaga a rejeição do próprio $transaction (deadlock, conexão caída)', async () => {
    const falha = new Error('could not serialize access due to concurrent update');
    prisma.$transaction.mockRejectedValue(falha);

    await expect(manager.executar(jest.fn().mockResolvedValue(undefined))).rejects.toBe(falha);
  });

  it('devolve valores falsy do callback sem convertê-los', async () => {
    await expect(manager.executar(jest.fn().mockResolvedValue(null))).resolves.toBeNull();
    await expect(manager.executar(jest.fn().mockResolvedValue(0))).resolves.toBe(0);
  });
});
