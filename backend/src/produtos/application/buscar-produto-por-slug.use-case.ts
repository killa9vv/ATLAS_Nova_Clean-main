import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../domain/produtos.exceptions';

@Injectable()
export class BuscarProdutoPorSlugUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(slug: string): Promise<Produto> {
    const produto = await this.produtoRepository.buscarPorSlug(slug);
    if (!produto) {
      throw new ProdutoNaoEncontradoException(slug);
    }
    return produto;
  }
}
