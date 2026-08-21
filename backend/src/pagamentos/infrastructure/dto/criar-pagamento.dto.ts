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
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  cpf?: string;
}

export class CriarPagamentoDto {
  @IsUUID()
  pedidoId: string;

  @IsEnum(MetodoPagamento)
  metodo: MetodoPagamento;

  @ValidateNested()
  @Type(() => PagadorDto)
  pagador: PagadorDto;

  @ValidateIf((dto) => dto.metodo === MetodoPagamento.CARTAO_CREDITO)
  @IsString()
  tokenCartao?: string;

  @ValidateIf((dto) => dto.metodo === MetodoPagamento.CARTAO_CREDITO)
  @IsInt()
  @Min(1)
  parcelas?: number;

  @ValidateIf((dto) => dto.metodo === MetodoPagamento.CARTAO_CREDITO)
  @IsString()
  metodoPagamentoId?: string;
}
