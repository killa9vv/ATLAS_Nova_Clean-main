import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../domain/produtos.exceptions';

@Injectable()
export class BuscarProdutoPorIdUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(id: string): Promise<Produto> {
    const produto = await this.produtoRepository.buscarPorId(id);
    if (!produto) {
      throw new ProdutoNaoEncontradoException(id);
    }
    return produto;
  }
}
