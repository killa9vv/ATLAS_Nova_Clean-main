import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository, ResultadoPaginado } from '../domain/produto.repository';
import { ListarProdutosQueryDto } from '../presentation/dto/listar-produtos-query.dto';

@Injectable()
export class ListarProdutosUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(query: ListarProdutosQueryDto): Promise<ResultadoPaginado<Produto>> {
    return this.produtoRepository.listarComFiltros({
      pagina: query.pagina,
      limite: query.limite,
      busca: query.busca,
      categoria: query.categoria,
      marcaId: query.marcaId,
      produtoTipoSlug: query.produtoTipoSlug,
      categorias: query.categorias,
      marcaIds: query.marcaIds,
      precoMin: query.precoMin,
      precoMax: query.precoMax,
      disponivel: query.disponivel !== undefined ? query.disponivel === 'true' : undefined,
      ativo: query.ativo !== undefined ? query.ativo === 'true' : undefined,
      emPromocao: query.emPromocao !== undefined ? query.emPromocao === 'true' : undefined,
      fotoPrimeiro: query.fotoPrimeiro !== undefined ? query.fotoPrimeiro === 'true' : undefined,
      ordenarPor: query.ordenarPor,
      direcao: query.direcao,
    });
  }
}
