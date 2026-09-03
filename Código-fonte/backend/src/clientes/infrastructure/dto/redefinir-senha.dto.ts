import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RedefinirSenhaDto {
  @ApiProperty({ example: 'a1b2c3...' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'senha-nova-123', minLength: 8 })
  @IsString()
  @MinLength(8)
  novaSenha!: string;
}
