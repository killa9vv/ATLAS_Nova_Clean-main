import { ApiProperty } from '@nestjs/swagger';
import {
  MotivoIndisponibilidade,
  ResultadoRepeticaoPedido,
} from '../../application/repetir-pedido.use-case';

class ItemRepeticaoResponseDto {
  @ApiProperty()
  produtoId!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  quantidade!: number;

  @ApiProperty()
  precoUnitario!: number;

  @ApiProperty({ description: 'true quando a quantidade foi reduzida pra caber no estoque atual.' })
  ajustado!: boolean;
}

class ItemIndisponivelResponseDto {
  @ApiProperty()
  produtoId!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ enum: ['PRODUTO_INDISPONIVEL', 'SEM_ESTOQUE'] })
  motivo!: MotivoIndisponibilidade;
}

export class RepetirPedidoResponseDto {
  @ApiProperty({ type: [ItemRepeticaoResponseDto] })
  itens!: ItemRepeticaoResponseDto[];

  @ApiProperty({ type: [ItemIndisponivelResponseDto] })
  itensIndisponiveis!: ItemIndisponivelResponseDto[];

  static fromDomain(resultado: ResultadoRepeticaoPedido): RepetirPedidoResponseDto {
    const dto = new RepetirPedidoResponseDto();
    dto.itens = resultado.itens;
    dto.itensIndisponiveis = resultado.itensIndisponiveis;
    return dto;
  }
}
