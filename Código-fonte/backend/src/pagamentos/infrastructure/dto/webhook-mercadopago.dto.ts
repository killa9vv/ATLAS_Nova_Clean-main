import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

class WebhookDataDto {
  @ApiPropertyOptional({ example: '123456789' })
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
  @IsOptional()
  @IsString()
  api_version?: string;

  @ApiPropertyOptional({ example: '2026-08-26T22:46:15Z' })
  @IsOptional()
  @IsString()
  date_created?: string;

  @ApiPropertyOptional({ example: 136905915450 })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  live_mode?: boolean;

  @ApiPropertyOptional({ example: '2992837347' })
  @IsOptional()
  @IsString()
  user_id?: string;
}
