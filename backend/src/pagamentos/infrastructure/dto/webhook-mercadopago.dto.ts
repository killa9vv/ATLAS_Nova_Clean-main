// DTO do payload de webhook enviado pelo Mercado Pago (campos mínimos usados pela aplicação).
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

class WebhookDataDto {
  @IsString()
  id: string;
}

export class WebhookMercadoPagoDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookDataDto)
  data?: WebhookDataDto;
}
