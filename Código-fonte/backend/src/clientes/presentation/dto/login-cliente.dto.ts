import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { NormalizarEmail } from '../../../shared/validation/normalizar-email.decorator';

export class LoginClienteDto {
  @ApiProperty({ example: 'maria@example.com' })
  @NormalizarEmail()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-forte-123', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha!: string;
}
