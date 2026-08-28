import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsIn, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { CarrinhoItemDto } from '../../../carrinho/infrastructure/dto/calcular-carrinho.dto';

export class CriarPedidoDto {
  @ApiProperty({ type: [CarrinhoItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CarrinhoItemDto)
  @ArrayMinSize(1)
  itens!: CarrinhoItemDto[];
  @ApiProperty({
    example: '01001000',
    description: 'CEP de destino da entrega, com 8 dígitos',
  })
  @IsString()
  @Matches(/^\d{8}$/, {
    message: 'cepDestino deve conter exatamente 8 dígitos',
  })
  cepDestino!: string;

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
