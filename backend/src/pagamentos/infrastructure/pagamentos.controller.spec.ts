// Testes do PagamentosController focados em UM comportamento: o que acontece
// quando MERCADOPAGO_WEBHOOK_SECRET não está configurado. Em produção isso
// precisa rejeitar (401) — sem o segredo não tem como validar quem está
// chamando —, mas fora de produção precisa continuar passando (conveniência
// de dev, já documentada com warning).
import { createHmac } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { PagamentosController } from './pagamentos.controller';
import { CriarPagamentoUseCase } from '../application/criar-pagamento.use-case';
import { ProcessarWebhookUseCase } from '../application/processar-webhook.use-case';

function criarAssinaturaValida(secret: string, dataId: string, xRequestId: string) {
  const ts = '1700000000';
  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const v1 = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

describe('PagamentosController.webhook', () => {
  let processarWebhookUseCase: jest.Mocked<ProcessarWebhookUseCase>;
  let configService: { get: jest.Mock };
  let controller: PagamentosController;
  const nodeEnvOriginal = process.env.NODE_ENV;

  beforeEach(() => {
    processarWebhookUseCase = {
      executar: jest.fn().mockResolvedValue({ processado: true }),
    } as unknown as jest.Mocked<ProcessarWebhookUseCase>;

    configService = { get: jest.fn() };

    controller = new PagamentosController(
      {} as CriarPagamentoUseCase,
      processarWebhookUseCase,
      configService as any,
    );
  });

  afterEach(() => {
    process.env.NODE_ENV = nodeEnvOriginal;
  });

  it('rejeita com 401 quando o segredo não está configurado E NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    configService.get.mockReturnValue(undefined);

    await expect(
      controller.webhook({ type: 'payment', data: { id: 'pag-1' } }, undefined, undefined, undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(processarWebhookUseCase.executar).not.toHaveBeenCalled();
  });

  it('processa normalmente sem segredo configurado fora de produção (conveniência de dev)', async () => {
    process.env.NODE_ENV = 'development';
    configService.get.mockReturnValue(undefined);

    const resultado = await controller.webhook(
      { type: 'payment', data: { id: 'pag-1' } },
      undefined,
      undefined,
      undefined,
    );

    expect(resultado).toEqual({ recebido: true });
    expect(processarWebhookUseCase.executar).toHaveBeenCalledWith('pag-1');
  });

  it('rejeita com 401 quando o segredo está configurado mas a assinatura é inválida', async () => {
    process.env.NODE_ENV = 'production';
    configService.get.mockReturnValue('segredo-configurado');

    await expect(
      controller.webhook(
        { type: 'payment', data: { id: 'pag-1' } },
        undefined,
        'assinatura-forjada',
        'req-1',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(processarWebhookUseCase.executar).not.toHaveBeenCalled();
  });

  it('processa normalmente quando o segredo está configurado e a assinatura é válida', async () => {
    process.env.NODE_ENV = 'production';
    const secret = 'segredo-configurado';
    configService.get.mockReturnValue(secret);
    const xSignature = criarAssinaturaValida(secret, 'pag-1', 'req-1');

    const resultado = await controller.webhook(
      { type: 'payment', data: { id: 'pag-1' } },
      undefined,
      xSignature,
      'req-1',
    );

    expect(resultado).toEqual({ recebido: true });
    expect(processarWebhookUseCase.executar).toHaveBeenCalledWith('pag-1');
  });
});
