import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListarProdutosQueryDto {
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

  @ApiPropertyOptional({ example: 'detergente' })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional({ example: 'limpeza' })
  @IsOptional()
  @IsString()
  categoria?: string;

  /** Vem como string na query string (ex: ?ativo=true). Se omitido, retorna ativos e inativos. */
  @ApiPropertyOptional({
    example: 'true',
    description: 'String "true"/"false". Se omitido, retorna ativos e inativos.',
  })
  @IsOptional()
  @IsBooleanString()
  ativo?: string;

  @ApiPropertyOptional({ enum: ['nome', 'preco', 'createdAt'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['nome', 'preco', 'createdAt'])
  ordenarPor?: 'nome' | 'preco' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direcao?: 'asc' | 'desc' = 'desc';
}
