import { ApiProperty } from '@nestjs/swagger';
import { CalcularFreteOutput } from '../../application/calcular-frete.use-case';
import { TipoOpcaoFrete } from '../../domain/frete.entity';

class OpcaoFreteResponseDto {
  @ApiProperty({ enum: ['ENTREGA', 'RETIRADA'], example: 'ENTREGA' })
  tipo: TipoOpcaoFrete;

  @ApiProperty({ example: 12 })
  valor: number;

  @ApiProperty({ example: 3 })
  prazoEstimadoDias: number;
}

export class FreteResponseDto {
  @ApiProperty({ type: [OpcaoFreteResponseDto] })
  opcoes: OpcaoFreteResponseDto[];

  static fromDomain(output: CalcularFreteOutput): FreteResponseDto {
    const dto = new FreteResponseDto();
    dto.opcoes = output.opcoes.map((opcao) => ({
      tipo: opcao.tipo,
      valor: opcao.valor,
      prazoEstimadoDias: opcao.prazoEstimadoDias,
    }));
    return dto;
  }
}
