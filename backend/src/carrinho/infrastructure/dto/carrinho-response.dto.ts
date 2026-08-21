import { Carrinho } from '../../domain/item-precificado';

class ItemCarrinhoResponseDto {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export class CarrinhoResponseDto {
  itens: ItemCarrinhoResponseDto[];
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
