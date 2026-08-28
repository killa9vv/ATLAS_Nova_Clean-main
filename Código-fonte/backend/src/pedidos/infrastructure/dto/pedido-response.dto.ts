import { ApiProperty } from '@nestjs/swagger';
import { Pedido } from '../../domain/pedido.entity';
import { StatusPedido } from '../../domain/status-pedido.enum';

export class ItemPedidoResponseDto {
  @ApiProperty()
  produtoId!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  quantidade!: number;

  @ApiProperty()
  precoUnitario!: number;

  @ApiProperty({
    example: 5.25,
    description: 'Parcela do frete atribuída a este item do pedido',
  })
  freteRateado!: number;
}

export class PedidoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: StatusPedido })
  status!: StatusPedido;

  @ApiProperty({ type: [ItemPedidoResponseDto] })
  itens!: ItemPedidoResponseDto[];

  @ApiProperty({
    example: 100,
    description: 'Total dos produtos do pedido, sem o frete',
  })
  total!: number;

  @ApiProperty({
    example: 15.9,
    description: 'Valor total do frete do pedido',
  })
  freteTotal!: number;

  @ApiProperty()
  createdAt!: Date;

  static fromDomain(pedido: Pedido): PedidoResponseDto {
    const dto = new PedidoResponseDto();

    dto.id = pedido.id;
    dto.status = pedido.status;
    dto.itens = pedido.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      freteRateado: item.freteRateado,
    }));
    dto.total = pedido.total;
    dto.freteTotal = pedido.freteTotal;
    dto.createdAt = pedido.createdAt;

    return dto;
  }
}
