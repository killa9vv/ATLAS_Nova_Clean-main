import { ApiProperty } from '@nestjs/swagger';
import { Pedido } from '../../domain/pedido.entity';
import { StatusPedido } from '../../domain/status-pedido.enum';

class ItemPedidoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  produtoId: string;

  @ApiProperty({ example: 'Detergente para Louça' })
  nome: string;

  @ApiProperty({ example: 2 })
  quantidade: number;

  @ApiProperty({ example: 12.9 })
  precoUnitario: number;
}

export class PedidoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ enum: StatusPedido, example: StatusPedido.CRIADO })
  status: StatusPedido;

  @ApiProperty({ type: [ItemPedidoResponseDto] })
  itens: ItemPedidoResponseDto[];

  @ApiProperty({ example: 25.8 })
  total: number;

  @ApiProperty({ example: '2026-08-22T18:30:00.000Z' })
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
