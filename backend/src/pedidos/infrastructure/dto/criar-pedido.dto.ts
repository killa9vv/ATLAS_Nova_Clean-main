import { Type } from 'class-transformer';
import { ArrayMinSize, ValidateNested } from 'class-validator';
import { CarrinhoItemDto } from '../../../carrinho/infrastructure/dto/calcular-carrinho.dto';

export class CriarPedidoDto {
  @ValidateNested({ each: true })
  @Type(() => CarrinhoItemDto)
  @ArrayMinSize(1)
  itens: CarrinhoItemDto[];
}
