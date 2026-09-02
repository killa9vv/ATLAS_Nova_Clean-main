import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { StatusPedido } from '../../domain/status-pedido.enum';

export class ListarMeusPedidosQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite: number = 10;

  @ApiPropertyOptional({ enum: StatusPedido })
  @IsOptional()
  @IsEnum(StatusPedido)
  status?: StatusPedido;
}
