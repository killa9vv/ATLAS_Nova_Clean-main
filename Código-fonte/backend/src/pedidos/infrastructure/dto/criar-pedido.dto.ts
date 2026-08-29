import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDefined,
  IsIn,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CarrinhoItemDto } from '../../../carrinho/infrastructure/dto/calcular-carrinho.dto';
import { TipoEntrega } from '../../domain/pedido.entity';
import { EnderecoEntregaDto } from './endereco-entrega.dto';

export class CriarPedidoDto {
  @ApiProperty({ type: [CarrinhoItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CarrinhoItemDto)
  @ArrayMinSize(1)
  itens: CarrinhoItemDto[];

  @ApiProperty({
    enum: ['ENTREGA', 'RETIRADA'],
    description:
      'ENTREGA cobra frete (calculado a partir de "endereco") e exige "endereco". RETIRADA não cobra frete e ignora "endereco".',
  })
  @IsIn(['ENTREGA', 'RETIRADA'])
  tipoEntrega: TipoEntrega;

  @ApiPropertyOptional({
    type: EnderecoEntregaDto,
    description: 'Obrigatório quando tipoEntrega é ENTREGA; ignorado em RETIRADA.',
  })
  @ValidateIf((dto: CriarPedidoDto) => dto.tipoEntrega === 'ENTREGA')
  @IsDefined()
  @ValidateNested()
  @Type(() => EnderecoEntregaDto)
  endereco?: EnderecoEntregaDto;

  @ApiPropertyOptional({
    enum: ['site', 'whatsapp'],
    default: 'site',
    description:
      'Canal do checkout. "whatsapp" registra o pedido já em AGUARDANDO_CONTATO — não passa pelo pagamento online.',
  })
  @IsOptional()
  @IsIn(['site', 'whatsapp'])
  canal?: 'site' | 'whatsapp';
}
