// Use case que lista todos os produtos do catálogo.
import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';

@Injectable()
export class ListarProdutosUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(): Promise<Produto[]> {
    return this.produtoRepository.listarTodos();
  }
}
