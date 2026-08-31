import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { TipoDesconto } from '../../domain/cupom.entity';

export class CriarCupomDto {
  @ApiProperty({ example: 'BEMVINDO10', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo!: string;

  @ApiProperty({ enum: ['PERCENTUAL', 'VALOR_FIXO'] })
  @IsIn(['PERCENTUAL', 'VALOR_FIXO'])
  tipoDesconto!: TipoDesconto;

  @ApiProperty({ example: 10, minimum: 0, description: '% se PERCENTUAL, R$ se VALOR_FIXO.' })
  @IsNumber()
  @Min(0)
  valor!: number;

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
