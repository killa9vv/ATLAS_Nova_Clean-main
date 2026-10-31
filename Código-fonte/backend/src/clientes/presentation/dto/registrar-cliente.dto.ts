import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// Sem senha de propósito: ela é escolhida pelo link de ativação enviado por e-mail
// (ver SolicitarCriacaoContaUseCase).

const REGEX_TELEFONE = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

export class RegistrarClienteDto {
  @ApiProperty({ example: 'Maria da Silva', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '(22) 99999-8888' })
  @IsOptional()
  @Matches(REGEX_TELEFONE, {
    message: 'telefone deve estar em um formato válido, ex.: (22) 99999-8888',
  })
  telefone?: string;
}
