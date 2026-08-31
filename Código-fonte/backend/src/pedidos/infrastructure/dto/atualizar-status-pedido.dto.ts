import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusPedido } from '../../domain/status-pedido.enum';

export class AtualizarStatusPedidoDto {
  @ApiProperty({
    enum: StatusPedido,
    description:
      'Nem toda transição é aceita — só as que fazem sentido pro admin disparar na mão ' +
      '(ex: cancelar um pedido não pago, confirmar manualmente um pedido de WhatsApp como ' +
      'pago, estornar um pedido pago). Transição inválida pro status atual retorna 409.',
  })
  @IsEnum(StatusPedido)
  status!: StatusPedido;
}
