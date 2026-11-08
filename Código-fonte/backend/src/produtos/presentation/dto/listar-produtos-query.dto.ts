import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBooleanString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

// Query string repetida (?categorias=a&categorias=b) já vira array pelo parser do
// Express (qs) — só um valor (?categorias=a) vem como string solta. Normaliza pra
// array nos dois casos, senão @IsArray rejeita a query mais comum (um filtro só).
function paraArray({ value }: { value: unknown }): string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value as string];
}

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

  @ApiPropertyOptional({ example: 'limpeza', description: 'Filtro de categoria única (legado).' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  @IsOptional()
  @IsUUID()
  marcaId?: string;

  @ApiPropertyOptional({
    example: 't-detergente-louca',
    description:
      'Variantes (marca/embalagem) do mesmo tipo genérico — usado pela página de detalhe de produto.',
  })
  @IsOptional()
  @IsString()
  produtoTipoSlug?: string;

  @ApiPropertyOptional({
    example: ['limpeza', 'papelaria'],
    type: [String],
    description:
      'Várias categorias combinadas com OR entre si (ex: ?categorias=limpeza&categorias=papelaria). Independente de `categoria` (singular) — usar um ou outro, não os dois.',
  })
  @IsOptional()
  @Transform(paraArray)
  @IsArray()
  @IsString({ each: true })
  categorias?: string[];

  @ApiPropertyOptional({
    example: ['b3f1c2d4-5678-4abc-9def-0123456789ab'],
    type: [String],
    description:
      'Várias marcas combinadas com OR entre si (ex: ?marcaIds=id1&marcaIds=id2). Independente de `marcaId` (singular).',
  })
  @IsOptional()
  @Transform(paraArray)
  @IsArray()
  @IsUUID('4', { each: true })
  marcaIds?: string[];

  @ApiPropertyOptional({ example: 10, minimum: 0, description: 'Preço mínimo (inclusive).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMin?: number;

  @ApiPropertyOptional({ example: 100, minimum: 0, description: 'Preço máximo (inclusive).' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precoMax?: number;

  /** Vem como string na query string (ex: ?disponivel=true). true = só estoque > 0. */
  @ApiPropertyOptional({
    example: 'true',
    description: 'String "true"/"false". true = só produtos com estoque > 0.',
  })
  @IsOptional()
  @IsBooleanString()
  disponivel?: string;

  /** Vem como string na query string (ex: ?ativo=true). Se omitido, retorna ativos e inativos. */
  @ApiPropertyOptional({
    example: 'true',
    description: 'String "true"/"false". Se omitido, retorna ativos e inativos.',
  })
  @IsOptional()
  @IsBooleanString()
  ativo?: string;

  /** Vem como string na query string (ex: ?emPromocao=true). true = só produtos com
   * preço promocional cadastrado. */
  @ApiPropertyOptional({
    example: 'true',
    description: 'String "true"/"false". true = só produtos com promoção ativa.',
  })
  @IsOptional()
  @IsBooleanString()
  emPromocao?: string;

  /** Vem como string na query string (ex: ?fotoPrimeiro=true). true = produtos com foto vêm
   * antes dos sem foto; dentro de cada grupo vale ordenarPor/direcao. */
  @ApiPropertyOptional({
    example: 'true',
    description: 'String "true"/"false". true = produtos com foto primeiro.',
  })
  @IsOptional()
  @IsBooleanString()
  fotoPrimeiro?: string;

  @ApiPropertyOptional({ enum: ['nome', 'preco', 'createdAt'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['nome', 'preco', 'createdAt'])
  ordenarPor?: 'nome' | 'preco' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direcao?: 'asc' | 'desc' = 'desc';
}
