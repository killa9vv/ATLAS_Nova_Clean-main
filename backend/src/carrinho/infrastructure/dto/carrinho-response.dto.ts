import { ApiProperty } from '@nestjs/swagger';
import { Carrinho } from '../../domain/item-precificado';

class ItemCarrinhoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  produtoId: string;

  @ApiProperty({ example: 'Detergente para Louça' })
  nome: string;

  @ApiProperty({ example: 2 })
  quantidade: number;

  @ApiProperty({ example: 12.9 })
  precoUnitario: number;

  @ApiProperty({ example: 25.8 })
  subtotal: number;
}

export class CarrinhoResponseDto {
  @ApiProperty({ type: [ItemCarrinhoResponseDto] })
  itens: ItemCarrinhoResponseDto[];

  @ApiProperty({ example: 25.8 })
  total: number;

  static fromDomain(carrinho: Carrinho): CarrinhoResponseDto {
    const dto = new CarrinhoResponseDto();
    dto.itens = carrinho.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      subtotal: item.subtotal,
    }));
    dto.total = carrinho.total;
    return dto;
  }
}
