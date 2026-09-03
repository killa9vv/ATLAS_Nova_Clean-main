import { ApiProperty } from '@nestjs/swagger';
import { ResultadoPaginadoPedidos } from '../../domain/pedido.repository';
import { PedidoResponseDto } from './pedido-response.dto';

export class MeusPedidosResponseDto {
  @ApiProperty({ type: [PedidoResponseDto] })
  itens!: PedidoResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  pagina!: number;

  @ApiProperty()
  limite!: number;

  static fromDomain(resultado: ResultadoPaginadoPedidos): MeusPedidosResponseDto {
    const dto = new MeusPedidosResponseDto();
    dto.itens = resultado.itens.map(PedidoResponseDto.fromDomain);
    dto.total = resultado.total;
    dto.pagina = resultado.pagina;
    dto.limite = resultado.limite;
    return dto;
  }
}
