// Testes da validação de assinatura HMAC do webhook do Mercado Pago.
import { createHmac } from 'crypto';
import { validarAssinaturaWebhookMercadoPago } from './mercado-pago-webhook-signature';

function assinar(manifest: string, secret: string): string {
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

describe('validarAssinaturaWebhookMercadoPago', () => {
  const secret = 'segredo-de-teste';
  const dataId = '123456789';
  const xRequestId = 'req-abc';
  const ts = '1704908010';

  it('valida uma assinatura correta', () => {
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const v1 = assinar(manifest, secret);

    const resultado = validarAssinaturaWebhookMercadoPago({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId,
      dataId,
      secret,
    });

    expect(resultado).toBe(true);
  });

  it('rejeita quando o hash não bate (segredo errado)', () => {
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const v1 = assinar(manifest, 'segredo-errado');

    const resultado = validarAssinaturaWebhookMercadoPago({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId,
      dataId,
      secret,
    });

    expect(resultado).toBe(false);
  });

  it('rejeita quando faltam headers de assinatura', () => {
    expect(
      validarAssinaturaWebhookMercadoPago({ xSignature: undefined, xRequestId, dataId, secret }),
    ).toBe(false);
  });

  it('rejeita quando o data.id foi alterado após a assinatura ser gerada', () => {
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const v1 = assinar(manifest, secret);

    const resultado = validarAssinaturaWebhookMercadoPago({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId,
      dataId: '999999999',
      secret,
    });

    expect(resultado).toBe(false);
  });
});
