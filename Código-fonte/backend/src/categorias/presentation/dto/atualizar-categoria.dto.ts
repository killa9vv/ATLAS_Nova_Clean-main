import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AtualizarCategoriaDto {
  @ApiProperty({ example: 'Limpeza', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @ApiPropertyOptional({ example: true, description: 'Categorias inativas somem da loja.' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
