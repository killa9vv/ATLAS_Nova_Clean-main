import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CriarProdutoDto {
  @ApiProperty({ example: 'Detergente para Louça', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @ApiPropertyOptional({ example: 'Detergente concentrado para louças, 500ml' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 12.9, minimum: 0 })
  @IsNumber()
  @Min(0)
  preco: number;

  @ApiPropertyOptional({ example: 100, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estoque?: number;

  @ApiPropertyOptional({ example: 'limpeza' })
  @IsOptional()
  @IsString()
  categoria?: string;
}
