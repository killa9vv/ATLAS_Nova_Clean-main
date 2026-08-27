import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CalcularFreteDto {
  @ApiProperty({ example: '28013-000' })
  @IsString()
  @IsNotEmpty()
  cepDestino: string;

  @ApiProperty({
    example: 3,
    minimum: 1,
    description: 'Soma das quantidades de itens do carrinho.',
  })
  @IsInt()
  @Min(1)
  quantidadeItens: number;

  @ApiProperty({ example: 99.9, minimum: 0, description: 'Valor total do carrinho (subtotal).' })
  @IsNumber()
  @Min(0)
  valorDeclarado: number;
}
