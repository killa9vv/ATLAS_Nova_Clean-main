import { ApiProperty } from '@nestjs/swagger';
import { Pedido } from '../../domain/pedido.entity';
import { StatusPedido } from '../../domain/status-pedido.enum';

/**
 * Recorte público e mínimo de um pedido — usado pelo checkout do site (convidado,
 * sem login) pra saber o total antes de pagar e acompanhar o status depois. Nunca
 * inclua aqui nada que não possa ficar exposto a quem só tem o id do pedido em mãos
 * (ver comentário em PedidosController.buscarStatus).
 */
export class PedidoStatusResponseDto {
  @ApiProperty({ example: '2026-000123' })
  numero: string;

  @ApiProperty({ enum: StatusPedido, example: StatusPedido.CRIADO })
  status: StatusPedido;

  @ApiProperty({ example: 25.8 })
  total: number;

  // Só um booleano, não o status/motivo do pagamento — basta pro checkout mostrar
  // "não aprovado, tente de novo" e não expõe nada do gateway.
  @ApiProperty({
    example: false,
    description:
      'Pedido ainda aguardando pagamento e a tentativa mais recente foi recusada/cancelada pelo banco.',
  })
  pagamentoRecusado: boolean;

  static fromDomain(pedido: Pedido, pagamentoRecusado = false): PedidoStatusResponseDto {
    const dto = new PedidoStatusResponseDto();
    dto.numero = pedido.numero;
    dto.status = pedido.status;
    dto.total = pedido.total;
    dto.pagamentoRecusado = pagamentoRecusado;
    return dto;
  }
}
