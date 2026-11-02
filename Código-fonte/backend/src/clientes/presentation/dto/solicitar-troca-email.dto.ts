import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { NormalizarEmail } from '../../../shared/validation/normalizar-email.decorator';

export class SolicitarTrocaEmailDto {
  @ApiProperty({ example: 'novo@example.com' })
  @NormalizarEmail()
  @IsEmail()
  novoEmail!: string;

  @ApiProperty({ example: 'senha-atual-123' })
  @IsString()
  senhaAtual!: string;
}
