import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { TipoDesconto } from '../../domain/cupom.entity';

// Sem `codigo` de propósito — ver comentário em AtualizarCupomUseCase.
export class AtualizarCupomDto {
  @ApiPropertyOptional({ enum: ['PERCENTUAL', 'VALOR_FIXO'] })
  @IsOptional()
  @IsIn(['PERCENTUAL', 'VALOR_FIXO'])
  tipoDesconto?: TipoDesconto;

  @ApiPropertyOptional({ example: 10, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validoAte?: Date;

  @ApiPropertyOptional({ example: 100, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  usoMaximo?: number;
}
