import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { CarrinhoItemDto } from '../../../carrinho/infrastructure/dto/calcular-carrinho.dto';

export class CriarPedidoDto {
  @ApiProperty({ type: [CarrinhoItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CarrinhoItemDto)
  @ArrayMinSize(1)
  itens: CarrinhoItemDto[];

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
