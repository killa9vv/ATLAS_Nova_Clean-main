import { ReconciliarPagamentosPendentesUseCase } from './reconciliar-pagamentos-pendentes.use-case';
import { ProcessarWebhookUseCase } from './processar-webhook.use-case';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { Pagamento } from '../domain/pagamento.entity';
import { MetodoPagamento } from '../domain/metodo-pagamento.enum';
import { StatusPagamento } from '../domain/status-pagamento.enum';

function criarPagamentoPendente(id: string, gatewayTransactionId: string): Pagamento {
  return new Pagamento(
    id,
    `pedido-${id}`,
    MetodoPagamento.PIX,
    StatusPagamento.PENDENTE,
    100,
    gatewayTransactionId,
    new Date(),
    new Date(),
  );
}

describe('ReconciliarPagamentosPendentesUseCase', () => {
  let pagamentoRepository: jest.Mocked<PagamentoRepository>;
  let processarWebhookUseCase: jest.Mocked<ProcessarWebhookUseCase>;
  let useCase: ReconciliarPagamentosPendentesUseCase;

  beforeEach(() => {
    pagamentoRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorGatewayTransactionId: jest.fn(),
      atualizarStatus: jest.fn(),
      listarPendentesCriadosAntesDe: jest.fn(),
    } as unknown as jest.Mocked<PagamentoRepository>;

    processarWebhookUseCase = {
      executar: jest.fn(),
    } as unknown as jest.Mocked<ProcessarWebhookUseCase>;

    useCase = new ReconciliarPagamentosPendentesUseCase(
      pagamentoRepository,
      processarWebhookUseCase,
    );
  });

  it('não consulta o gateway quando não há pagamentos pendentes antigos', async () => {
    pagamentoRepository.listarPendentesCriadosAntesDe.mockResolvedValue([]);

    await useCase.executar();

    expect(processarWebhookUseCase.executar).not.toHaveBeenCalled();
  });

  it('reprocessa cada pagamento pendente encontrado, um a um, reaproveitando o webhook use case', async () => {
    const pagamentos = [
      criarPagamentoPendente('pag-1', 'mp-1'),
      criarPagamentoPendente('pag-2', 'mp-2'),
    ];
    pagamentoRepository.listarPendentesCriadosAntesDe.mockResolvedValue(pagamentos);
    processarWebhookUseCase.executar.mockResolvedValue({ processado: true });

    await useCase.executar();

    expect(processarWebhookUseCase.executar).toHaveBeenCalledWith('mp-1');
    expect(processarWebhookUseCase.executar).toHaveBeenCalledWith('mp-2');
    expect(processarWebhookUseCase.executar).toHaveBeenCalledTimes(2);
  });

  it('continua reconciliando os demais pagamentos mesmo se um deles falhar', async () => {
    const pagamentos = [
      criarPagamentoPendente('pag-1', 'mp-1'),
      criarPagamentoPendente('pag-2', 'mp-2'),
    ];
    pagamentoRepository.listarPendentesCriadosAntesDe.mockResolvedValue(pagamentos);
    processarWebhookUseCase.executar
      .mockRejectedValueOnce(new Error('gateway indisponível'))
      .mockResolvedValueOnce({ processado: true });

    await expect(useCase.executar()).resolves.toBeUndefined();

    expect(processarWebhookUseCase.executar).toHaveBeenCalledTimes(2);
  });

  it('usa um corte de tempo (pagamentos recentes não são reconsultados)', async () => {
    pagamentoRepository.listarPendentesCriadosAntesDe.mockResolvedValue([]);
    const antes = Date.now();

    await useCase.executar();

    const [limite] = pagamentoRepository.listarPendentesCriadosAntesDe.mock.calls[0];
    expect(limite).toBeInstanceOf(Date);
    expect((limite as Date).getTime()).toBeLessThan(antes);
  });
});
