import { Injectable } from '@nestjs/common';
import { ImagemProduto } from '../domain/imagem-produto.entity';
import { ImagemProdutoRepository } from '../domain/imagem-produto.repository';

@Injectable()
export class ListarImagensProdutoUseCase {
  constructor(private readonly imagemProdutoRepository: ImagemProdutoRepository) {}

  async executar(produtoId: string): Promise<ImagemProduto[]> {
    return this.imagemProdutoRepository.listarPorProduto(produtoId);
  }
}
