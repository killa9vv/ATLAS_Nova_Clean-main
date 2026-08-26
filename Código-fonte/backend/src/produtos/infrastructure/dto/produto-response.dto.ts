import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Produto } from '../../domain/produto.entity';

export class ProdutoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ example: 'Detergente para Louça' })
  nome: string;

  @ApiProperty({ example: 'detergente-para-louca' })
  slug: string;

  @ApiPropertyOptional({ example: 'Detergente concentrado para louças, 500ml' })
  descricao?: string;

  @ApiPropertyOptional({ example: 'limpeza' })
  categoria?: string;

  @ApiProperty({ example: 12.9 })
  preco: number;

  @ApiProperty({ example: 100 })
  estoque: number;

  @ApiProperty({ example: true })
  ativo: boolean;

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
    return dto;
  }
}
