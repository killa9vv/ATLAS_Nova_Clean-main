import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { NormalizarEmail } from '../../../shared/validation/normalizar-email.decorator';

export class LoginDto {
  @ApiProperty({ example: 'admin@atlasnovaclean.com' })
  @NormalizarEmail()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-forte-123', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha!: string;
}
