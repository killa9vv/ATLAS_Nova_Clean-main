import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const REGEX_TELEFONE = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

export class AtualizarClienteDto {
  @ApiPropertyOptional({ example: 'Maria da Silva', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nome?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(22) 99999-8888' })
  @IsOptional()
  @Matches(REGEX_TELEFONE, {
    message: 'telefone deve estar em um formato válido, ex.: (22) 99999-8888',
  })
  telefone?: string;

  @ApiPropertyOptional({ example: '12345678909' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ example: '12345678000195' })
  @IsOptional()
  @IsString()
  cnpj?: string;
}
