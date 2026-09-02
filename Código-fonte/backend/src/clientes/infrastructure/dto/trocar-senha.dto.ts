import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TrocarSenhaDto {
  @ApiProperty({ example: 'senha-atual-123' })
  @IsString()
  senhaAtual!: string;

  @ApiProperty({ example: 'senha-nova-123', minLength: 8 })
  @IsString()
  @MinLength(8)
  novaSenha!: string;
}
