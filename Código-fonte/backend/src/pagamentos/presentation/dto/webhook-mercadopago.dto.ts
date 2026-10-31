import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Allow, IsOptional, IsString, ValidateNested } from 'class-validator';

// O Mercado Pago não é consistente no tipo de alguns campos: o payload real manda
// `id` numérico e `user_id` string, o "Simular notificação" do painel manda o
// contrário (`id: "123456"`, `user_id: 2992837347`). Campos que a gente usa viram
// string; os que são só metadado ficam com @Allow() (aceitos sem checar tipo).
const paraString = ({ value }: { value: unknown }) =>
  typeof value === 'number' ? String(value) : value;

class WebhookDataDto {
  @ApiPropertyOptional({ example: '123456789' })
  @Transform(paraString)
  @IsString()
  id: string;
}

/**
 * Corpo real de uma notificação do Mercado Pago — além de type/action/data, ele
 * sempre manda estes outros campos (confirmado direto no payload recebido via
 * webhook). O ValidationPipe global usa forbidNonWhitelisted: true, então
 * qualquer campo do payload real que não esteja declarado aqui derruba a
 * notificação inteira com 400 antes mesmo de chegar no controller.
 */
export class WebhookMercadoPagoDto {
  @ApiPropertyOptional({ example: 'payment' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'payment.updated' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ type: WebhookDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookDataDto)
  data?: WebhookDataDto;

  @ApiPropertyOptional({ example: 'v1' })
  @Allow()
  api_version?: unknown;

  @ApiPropertyOptional({ example: '2026-08-26T22:46:15Z' })
  @Allow()
  date_created?: unknown;

  @ApiPropertyOptional({ example: 136905915450 })
  @Allow()
  id?: unknown;

  @ApiPropertyOptional({ example: false })
  @Allow()
  live_mode?: unknown;

  @ApiPropertyOptional({ example: '2992837347' })
  @Allow()
  user_id?: unknown;
}
