import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AtualizarCategoriaDto {
  @ApiProperty({ example: 'Limpeza', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;
}
