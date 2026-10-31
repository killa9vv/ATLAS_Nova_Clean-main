import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { NormalizarEmail } from '../../../shared/validation/normalizar-email.decorator';

export class EsqueciSenhaDto {
  @ApiProperty({ example: 'maria@example.com' })
  @NormalizarEmail()
  @IsEmail()
  email!: string;
}
