import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CriarProdutoDto {
  @ApiProperty({ example: 'Detergente para Louça', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome!: string;

  @ApiPropertyOptional({
    example: 'Detergente concentrado para louças, 500ml',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 12.9, minimum: 0 })
  @IsNumber()
  @Min(0)
  preco!: number;

  @ApiPropertyOptional({ example: 100, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estoque?: number;

  @ApiPropertyOptional({ example: 'limpeza' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ example: 0.5, minimum: 0.001 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  pesoKg?: number;

  @ApiPropertyOptional({ example: 10, minimum: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  alturaCm?: number;

  @ApiPropertyOptional({ example: 15, minimum: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  larguraCm?: number;

  @ApiPropertyOptional({ example: 20, minimum: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  comprimentoCm?: number;
}
