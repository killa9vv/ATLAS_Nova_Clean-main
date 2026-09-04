import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CarrinhoItemDto } from '../../../carrinho/infrastructure/dto/calcular-carrinho.dto';
import { TipoEntrega } from '../../domain/pedido.entity';
import { EnderecoEntregaDto } from './endereco-entrega.dto';
import { ContatoPedidoDto } from './contato-pedido.dto';

export class CriarPedidoDto {
  @ApiProperty({ type: [CarrinhoItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CarrinhoItemDto)
  @ArrayMinSize(1)
  itens!: CarrinhoItemDto[];

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

  @ApiProperty({ type: ContatoPedidoDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ContatoPedidoDto)
  contato!: ContatoPedidoDto;

  @ApiPropertyOptional({
    description:
      'Vincula o pedido a um cliente cadastrado sem login (ex: "salvar meus dados" no ' +
      'checkout, cadastro sem senha). Ignorado quando a requisição vem autenticada — nesse ' +
      'caso o cliente é sempre o do token, nunca este campo (ver PedidosController.criar).',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiPropertyOptional({
    enum: ['site', 'whatsapp'],
    default: 'site',
    description:
      'Canal do checkout. "whatsapp" registra o pedido já em AGUARDANDO_CONTATO — não passa pelo pagamento online.',
  })
  @IsOptional()
  @IsIn(['site', 'whatsapp'])
  canal?: 'site' | 'whatsapp';

  @ApiPropertyOptional({
    description: 'Código de cupom a aplicar. 409 se não existir/estiver inválido.',
  })
  @IsOptional()
  @IsString()
  cupomCodigo?: string;
}
