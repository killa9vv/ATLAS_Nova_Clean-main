import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { StatusPedido } from '../../domain/status-pedido.enum';

export class ListarPedidosAdminQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite: number = 20;

  @ApiPropertyOptional({ enum: StatusPedido })
  @IsOptional()
  @IsEnum(StatusPedido)
  status?: StatusPedido;

  @ApiPropertyOptional({ description: 'Filtra pedidos de um cliente cadastrado específico.' })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Início do período, por createdAt (inclusive).',
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Fim do período, por createdAt (inclusive).',
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}
