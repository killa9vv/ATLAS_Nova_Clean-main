import { ResultadoPaginado } from '../../domain/produto.repository';
import { Produto } from '../../domain/produto.entity';
import { ProdutoResponseDto } from './produto-response.dto';

export class ProdutoPaginadoResponseDto {
  itens: ProdutoResponseDto[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;

  static fromDomain(resultado: ResultadoPaginado<Produto>): ProdutoPaginadoResponseDto {
    const dto = new ProdutoPaginadoResponseDto();
    dto.itens = resultado.itens.map(ProdutoResponseDto.fromDomain);
    dto.total = resultado.total;
    dto.pagina = resultado.pagina;
    dto.limite = resultado.limite;
    dto.totalPaginas = Math.max(1, Math.ceil(resultado.total / resultado.limite));
    return dto;
  }
}
