import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AtualizarQuantidadeItemDto {
  @ApiProperty({ example: 3, minimum: 0, description: '0 remove o item do carrinho.' })
  @IsInt()
  @Min(0)
  quantidade: number;
}
