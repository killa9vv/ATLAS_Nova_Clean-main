import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, IsString, Min, ValidateNested } from 'class-validator';

export class CarrinhoItemDto {
  @IsString()
  produtoId: string;

  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CalcularCarrinhoDto {
  @ValidateNested({ each: true })
  @Type(() => CarrinhoItemDto)
  @ArrayMinSize(1)
  itens: CarrinhoItemDto[];
}
