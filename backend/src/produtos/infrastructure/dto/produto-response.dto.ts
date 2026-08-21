import { Produto } from '../../domain/produto.entity';

export class ProdutoResponseDto {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  estoque: number;
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
