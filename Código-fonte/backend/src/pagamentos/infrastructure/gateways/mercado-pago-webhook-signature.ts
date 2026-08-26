import { createHmac, timingSafeEqual } from 'crypto';

export interface ParametrosAssinaturaWebhook {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | undefined;
  secret: string;
}

/**
 * Valida a assinatura HMAC do webhook do Mercado Pago.
 * Formato do header x-signature: "ts=<timestamp>,v1=<hash>".
 * Manifest: `id:<data.id em minúsculas>;request-id:<x-request-id>;ts:<ts>;`
 */
export function validarAssinaturaWebhookMercadoPago(params: ParametrosAssinaturaWebhook): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!xSignature || !dataId || !secret) {
    return false;
  }

  const partes = new Map(
    xSignature
      .split(',')
      .map((parte) => parte.split('='))
      .filter(([chave, valor]) => chave && valor)
      .map(([chave, valor]) => [chave.trim(), valor.trim()]),
  );

  const ts = partes.get('ts');
  const v1 = partes.get('v1');
  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};${xRequestId ? `request-id:${xRequestId};` : ''}ts:${ts};`;
  const hashEsperado = createHmac('sha256', secret).update(manifest).digest('hex');

  if (hashEsperado.length !== v1.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(hashEsperado), Buffer.from(v1));
}
