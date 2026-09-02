import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusPedido } from '../../domain/status-pedido.enum';
import { RastreioPedido } from '../../application/buscar-rastreio-pedido.use-case';

class EventoHistoricoResponseDto {
  @ApiPropertyOptional({ enum: StatusPedido })
  statusAnterior?: StatusPedido;

  @ApiProperty({ enum: StatusPedido })
  statusNovo!: StatusPedido;

  @ApiProperty()
  alteradoEm!: Date;
}

export class RastreioPedidoResponseDto {
  @ApiProperty({ enum: StatusPedido })
  status!: StatusPedido;

  @ApiPropertyOptional({ example: 'BR123456789BR' })
  codigoRastreio?: string;

  @ApiProperty({ type: [EventoHistoricoResponseDto], description: 'Mais recente primeiro.' })
  historico!: EventoHistoricoResponseDto[];

  static fromDomain(rastreio: RastreioPedido): RastreioPedidoResponseDto {
    const dto = new RastreioPedidoResponseDto();
    dto.status = rastreio.pedido.status;
    dto.codigoRastreio = rastreio.pedido.codigoRastreio;
    dto.historico = rastreio.historico.map((evento) => ({
      statusAnterior: evento.statusAnterior,
      statusNovo: evento.statusNovo,
      alteradoEm: evento.alteradoEm,
    }));
    return dto;
  }
}
