import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MetodoPagamento } from '../../domain/metodo-pagamento.enum';

export class PagadorDto {
  @ApiProperty({ example: 'cliente@email.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Maria Silva' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ example: '12345678900' })
  @IsOptional()
  @IsString()
  cpf?: string;
}

export class CriarPagamentoDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  @IsUUID()
  pedidoId: string;

  @ApiProperty({ enum: MetodoPagamento, example: MetodoPagamento.PIX })
  @IsEnum(MetodoPagamento)
  metodo: MetodoPagamento;

  @ApiProperty({ type: PagadorDto })
  @ValidateNested()
  @Type(() => PagadorDto)
  pagador: PagadorDto;

  @ApiPropertyOptional({
    description:
      'Token gerado pelo SDK do Mercado Pago no frontend. Obrigatório quando metodo=CARTAO_CREDITO.',
  })
  @ValidateIf((dto) => dto.metodo === MetodoPagamento.CARTAO_CREDITO)
  @IsString()
  tokenCartao?: string;

  @ApiPropertyOptional({ example: 1, description: 'Obrigatório quando metodo=CARTAO_CREDITO.' })
  @ValidateIf((dto) => dto.metodo === MetodoPagamento.CARTAO_CREDITO)
  @IsInt()
  @Min(1)
  parcelas?: number;

  @ApiPropertyOptional({
    example: 'master',
    description: 'Obrigatório quando metodo=CARTAO_CREDITO.',
  })
  @ValidateIf((dto) => dto.metodo === MetodoPagamento.CARTAO_CREDITO)
  @IsString()
  metodoPagamentoId?: string;
}
