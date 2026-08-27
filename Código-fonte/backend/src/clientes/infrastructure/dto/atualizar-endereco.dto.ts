import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AtualizarEnderecoDto {
  @ApiPropertyOptional({ example: '28013-000' })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiPropertyOptional({ example: 'Rua do Sol' })
  @IsOptional()
  @IsString()
  logradouro?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({ example: 'Apto 201' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  complemento?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional({ example: 'Campos dos Goytacazes' })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({ example: 'RJ' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;
}
