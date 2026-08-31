import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AtualizarRastreioPedidoDto {
  @ApiPropertyOptional({
    example: 'BR123456789BR',
    description: 'Vazio/ausente limpa o código de rastreio.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigoRastreio?: string;
}
