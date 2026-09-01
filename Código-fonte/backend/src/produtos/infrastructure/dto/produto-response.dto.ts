import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Produto } from '../../domain/produto.entity';

class MarcaDoProdutoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id!: string;

  @ApiProperty({ example: 'Ypê' })
  nome!: string;

  @ApiPropertyOptional({ example: '/brands/ype.png' })
  imagemUrl?: string;
}

class ProdutoTipoDoProdutoResponseDto {
  @ApiProperty({ example: 't-detergente-louca' })
  slug!: string;

  @ApiProperty({ example: 'Detergente para Louça' })
  nome!: string;
}

export class ProdutoResponseDto {
  @ApiProperty({
    example: 'b3f1c2d4-5678-4abc-9def-0123456789ab',
  })
  id!: string;

  @ApiProperty({ example: 'Detergente para Louça' })
  nome!: string;

  @ApiProperty({ example: 'detergente-para-louca' })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Detergente concentrado para louças, 500ml',
  })
  descricao?: string;

  @ApiPropertyOptional({ example: 'limpeza' })
  categoria?: string;

  @ApiProperty({ example: 12.9 })
  preco!: number;

  @ApiProperty({ example: 100 })
  estoque!: number;

  @ApiProperty({ example: true })
  ativo!: boolean;

  @ApiPropertyOptional({ example: 0.5 })
  pesoKg?: number;

  @ApiPropertyOptional({ example: 10 })
  alturaCm?: number;

  @ApiPropertyOptional({ example: 15 })
  larguraCm?: number;

  @ApiPropertyOptional({ example: 20 })
  comprimentoCm?: number;

  @ApiPropertyOptional({ example: 'Neutro · 500ml' })
  pack?: string;

  @ApiPropertyOptional({ type: MarcaDoProdutoResponseDto })
  marca?: MarcaDoProdutoResponseDto;

  @ApiPropertyOptional({ type: ProdutoTipoDoProdutoResponseDto })
  produtoTipo?: ProdutoTipoDoProdutoResponseDto;

  static fromDomain(produto: Produto): ProdutoResponseDto {
    const dto = new ProdutoResponseDto();

    dto.id = produto.id;
    dto.nome = produto.nome;
    dto.slug = produto.slug;
    dto.descricao = produto.descricao;
    dto.categoria = produto.categoria;
    dto.preco = produto.preco;
    dto.estoque = produto.estoque;
    dto.ativo = produto.ativo;
    dto.pesoKg = produto.pesoKg;
    dto.alturaCm = produto.alturaCm;
    dto.larguraCm = produto.larguraCm;
    dto.comprimentoCm = produto.comprimentoCm;
    dto.pack = produto.pack;
    dto.marca = produto.marca;
    dto.produtoTipo = produto.produtoTipo;

    return dto;
  }
}
