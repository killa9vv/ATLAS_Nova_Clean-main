import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository, ResultadoPaginado } from '../domain/produto.repository';
import { ListarProdutosQueryDto } from '../infrastructure/dto/listar-produtos-query.dto';

@Injectable()
export class ListarProdutosUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(query: ListarProdutosQueryDto): Promise<ResultadoPaginado<Produto>> {
    return this.produtoRepository.listarComFiltros({
      pagina: query.pagina,
      limite: query.limite,
      busca: query.busca,
      categoria: query.categoria,
      ativo: query.ativo !== undefined ? query.ativo === 'true' : undefined,
      ordenarPor: query.ordenarPor,
      direcao: query.direcao,
    });
  }
}
