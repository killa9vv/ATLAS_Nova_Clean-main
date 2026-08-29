import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CriarEnderecoDto {
  @ApiProperty({ example: '28013-000' })
  @IsString()
  @IsNotEmpty()
  cep: string;

  @ApiProperty({ example: 'Rua do Sol' })
  @IsString()
  @IsNotEmpty()
  logradouro: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiPropertyOptional({ example: 'Apto 201' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  complemento?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  @IsNotEmpty()
  bairro: string;

  @ApiProperty({ example: 'Campos dos Goytacazes' })
  @IsString()
  @IsNotEmpty()
  cidade: string;

  @ApiProperty({ example: 'RJ', minLength: 2, maxLength: 2 })
  @IsString()
  @MaxLength(2)
  estado: string;
}
