import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AtualizarMarcaDto {
  @ApiProperty({ example: 'Ypê', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @ApiPropertyOptional({ example: true, description: 'Marcas inativas somem da loja.' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
