import { EnvioDiretoEmailQueueAdapter } from './envio-direto-email-queue.adapter';
import { ProcessarEmailUseCase } from '../application/processar-email.use-case';

describe('EnvioDiretoEmailQueueAdapter', () => {
  it('processa a tarefa na hora', async () => {
    const executar = jest.fn().mockResolvedValue(undefined);
    const adapter = new EnvioDiretoEmailQueueAdapter({
      executar,
    } as unknown as ProcessarEmailUseCase);

    await adapter.enfileirar({ tipo: 'CONFIRMACAO_PEDIDO', pedidoId: 'pedido-1' });

    expect(executar).toHaveBeenCalledWith({ tipo: 'CONFIRMACAO_PEDIDO', pedidoId: 'pedido-1' });
  });

  it('nunca lança, mesmo se o envio falhar', async () => {
    const adapter = new EnvioDiretoEmailQueueAdapter({
      executar: jest.fn().mockRejectedValue(new Error('Resend fora do ar')),
    } as unknown as ProcessarEmailUseCase);

    await expect(
      adapter.enfileirar({ tipo: 'PAGAMENTO_APROVADO', pedidoId: 'pedido-1' }),
    ).resolves.toBeUndefined();
  });
});
