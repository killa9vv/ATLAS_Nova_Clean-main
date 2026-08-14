// DTO de saída do produto, mapeado a partir da entidade de domínio.
import { Produto } from '../../domain/produto.entity';

export class ProdutoResponseDto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;

  static fromDomain(produto: Produto): ProdutoResponseDto {
    const dto = new ProdutoResponseDto();
    dto.id = produto.id;
    dto.nome = produto.nome;
    dto.descricao = produto.descricao;
    dto.preco = produto.preco;
    dto.estoque = produto.estoque;
    return dto;
  }
}
