import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Cupom, TipoDesconto } from '../../domain/cupom.entity';

export class CupomResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id!: string;

  @ApiProperty({ example: 'BEMVINDO10' })
  codigo!: string;

  @ApiProperty({ enum: ['PERCENTUAL', 'VALOR_FIXO'] })
  tipoDesconto!: TipoDesconto;

  @ApiProperty({ example: 10 })
  valor!: number;

  @ApiProperty({ example: true })
  ativo!: boolean;

  @ApiProperty({ example: 34 })
  usosCount!: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  validoAte?: Date;

  @ApiPropertyOptional({ example: 100 })
  usoMaximo?: number;

  @ApiProperty({ example: '2026-08-22T18:30:00.000Z' })
  createdAt!: Date;

  static fromDomain(cupom: Cupom): CupomResponseDto {
    const dto = new CupomResponseDto();
    dto.id = cupom.id;
    dto.codigo = cupom.codigo;
    dto.tipoDesconto = cupom.tipoDesconto;
    dto.valor = cupom.valor;
    dto.ativo = cupom.ativo;
    dto.usosCount = cupom.usosCount;
    dto.validoAte = cupom.validoAte;
    dto.usoMaximo = cupom.usoMaximo;
    dto.createdAt = cupom.createdAt;
    return dto;
  }
}
