import { Type } from 'class-transformer';
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListarProdutosQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite: number = 10;

  @IsOptional()
  @IsString()
  busca?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  /** Vem como string na query string (ex: ?ativo=true). Se omitido, retorna ativos e inativos. */
  @IsOptional()
  @IsBooleanString()
  ativo?: string;

  @IsOptional()
  @IsIn(['nome', 'preco', 'createdAt'])
  ordenarPor?: 'nome' | 'preco' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  direcao?: 'asc' | 'desc' = 'desc';
}
