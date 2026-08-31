import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

class ContatoPedidoResponseDto {
  @ApiProperty({ example: 'Maria da Silva' })
  nome: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '(22) 99999-8888' })
  telefone?: string;
}

class EnderecoEntregaResponseDto {
  @ApiProperty({ example: '28013-000' })
  cep: string;

  @ApiProperty({ example: 'Rua do Sol' })
  logradouro: string;

  @ApiProperty({ example: '123' })
  numero: string;

  @ApiPropertyOptional({ example: 'Apto 201' })
  complemento?: string;

  @ApiProperty({ example: 'Centro' })
  bairro: string;

  @ApiProperty({ example: 'Campos dos Goytacazes' })
  cidade: string;

  @ApiProperty({ example: 'RJ' })
  estado: string;
}

export class PedidoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: StatusPedido })
  status!: StatusPedido;

  @ApiProperty({ type: [ItemPedidoResponseDto] })
  itens!: ItemPedidoResponseDto[];

  @ApiProperty({ example: 25.8, description: 'Total dos itens + valorFrete.' })
  total!: number;

  @ApiProperty({ enum: ['ENTREGA', 'RETIRADA'], example: 'ENTREGA' })
  tipoEntrega!: 'ENTREGA' | 'RETIRADA';

  @ApiProperty({ example: 12, description: '0 quando tipoEntrega é RETIRADA.' })
  valorFrete!: number;

  @ApiPropertyOptional({ type: EnderecoEntregaResponseDto })
  endereco?: EnderecoEntregaResponseDto;

  @ApiPropertyOptional({ example: 'BR123456789BR' })
  codigoRastreio?: string;

  @ApiProperty({ type: ContatoPedidoResponseDto })
  contato!: ContatoPedidoResponseDto;

  @ApiPropertyOptional({
    example: 'b3f1c2d4-5678-4abc-9def-0123456789ab',
    description: 'Presente quando o comprador optou por salvar os dados no checkout.',
  })
  clienteId?: string;

  @ApiProperty({ example: '2026-08-22T18:30:00.000Z' })
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
    dto.tipoEntrega = pedido.tipoEntrega;
    dto.valorFrete = pedido.valorFrete;
    dto.endereco = pedido.endereco;
    dto.codigoRastreio = pedido.codigoRastreio;
    dto.contato = pedido.contato ?? { nome: '' };
    dto.clienteId = pedido.clienteId;
    dto.createdAt = pedido.createdAt;

    return dto;
  }
}
