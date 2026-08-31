import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const REGEX_TELEFONE = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

/** Contato de quem comprou — vira snapshot em Pedido (ver ContatoPedido no domínio),
 * exigido sempre: não há checkout sem identificar o comprador. */
export class ContatoPedidoDto {
  @ApiProperty({ example: 'Maria da Silva', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

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
}
