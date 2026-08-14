// DTO de saída do pedido, mapeado a partir da entidade de domínio.
import { Pedido } from '../../domain/pedido.entity';
import { StatusPedido } from '../../domain/status-pedido.enum';

class ItemPedidoResponseDto {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export class PedidoResponseDto {
  id: string;
  status: StatusPedido;
  itens: ItemPedidoResponseDto[];
  total: number;
  createdAt: Date;

  static fromDomain(pedido: Pedido): PedidoResponseDto {
    const dto = new PedidoResponseDto();
    dto.id = pedido.id;
    dto.status = pedido.status;
    dto.itens = pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    }));
    dto.total = pedido.total;
    dto.createdAt = pedido.createdAt;
    return dto;
  }
}
