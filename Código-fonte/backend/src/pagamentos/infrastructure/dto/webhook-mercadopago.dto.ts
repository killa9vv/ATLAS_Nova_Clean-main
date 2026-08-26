import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class WebhookDataDto {
  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  id: string;
}

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
}
