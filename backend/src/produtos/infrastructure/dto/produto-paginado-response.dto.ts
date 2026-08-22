import { ApiProperty } from '@nestjs/swagger';
import { ResultadoPaginado } from '../../domain/produto.repository';
import { Produto } from '../../domain/produto.entity';
import { ProdutoResponseDto } from './produto-response.dto';

export class ProdutoPaginadoResponseDto {
  @ApiProperty({ type: [ProdutoResponseDto] })
  itens: ProdutoResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  limite: number;

  @ApiProperty({ example: 5 })
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
