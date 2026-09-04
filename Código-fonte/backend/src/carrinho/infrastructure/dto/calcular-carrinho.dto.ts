import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CarrinhoItemDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  @IsString()
  produtoId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantidade: number;
}

export class CalcularCarrinhoDto {
  @ApiProperty({ type: [CarrinhoItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CarrinhoItemDto)
  @ArrayMinSize(1)
  itens: CarrinhoItemDto[];

  @ApiPropertyOptional({
    description: 'Código de cupom a aplicar. 409 se não existir/estiver inválido.',
  })
  @IsOptional()
  @IsString()
  cupomCodigo?: string;
}
