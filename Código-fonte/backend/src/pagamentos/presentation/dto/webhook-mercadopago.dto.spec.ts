import { ValidationPipe } from '@nestjs/common';
import { WebhookMercadoPagoDto } from './webhook-mercadopago.dto';

// Mesma configuração do ValidationPipe global (main.ts).
const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

function validar(corpo: unknown): Promise<WebhookMercadoPagoDto> {
  return pipe.transform(corpo, { type: 'body', metatype: WebhookMercadoPagoDto });
}

describe('WebhookMercadoPagoDto', () => {
  it('aceita o payload real do Mercado Pago (id numérico, user_id string)', async () => {
    const dto = await validar({
      action: 'payment.updated',
      api_version: 'v1',
      data: { id: '136905915450' },
      date_created: '2026-08-26T22:46:15Z',
      id: 136905915450,
      live_mode: false,
      type: 'payment',
      user_id: '2992837347',
    });
    expect(dto.data?.id).toBe('136905915450');
  });

  it('aceita o payload do "Simular notificação" (id string, user_id numérico)', async () => {
    const dto = await validar({
      action: 'payment.updated',
      api_version: 'v1',
      data: { id: '123456' },
      date_created: '2021-11-01T02:02:02Z',
      id: '123456',
      live_mode: false,
      type: 'payment',
      user_id: 2992837347,
    });
    expect(dto.type).toBe('payment');
    expect(dto.data?.id).toBe('123456');
  });

  it('converte data.id numérico pra string', async () => {
    const dto = await validar({ type: 'payment', data: { id: 123 } });
    expect(dto.data?.id).toBe('123');
  });

  it('continua rejeitando campos desconhecidos', async () => {
    await expect(validar({ type: 'payment', campoInventado: 1 })).rejects.toThrow();
  });
});
