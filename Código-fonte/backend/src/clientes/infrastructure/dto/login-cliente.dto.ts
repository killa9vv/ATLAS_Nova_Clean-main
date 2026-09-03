import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginClienteDto {
  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-forte-123', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha!: string;
}
