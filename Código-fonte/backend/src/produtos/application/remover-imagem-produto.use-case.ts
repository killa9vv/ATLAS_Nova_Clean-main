import { Injectable } from '@nestjs/common';
import { ImageStorage } from '../domain/image-storage.port';
import { ImagemProdutoRepository } from '../domain/imagem-produto.repository';
import { ImagemProdutoNaoEncontradaException } from '../domain/produtos.exceptions';

@Injectable()
export class RemoverImagemProdutoUseCase {
  constructor(
    private readonly imagemProdutoRepository: ImagemProdutoRepository,
    private readonly imageStorage: ImageStorage,
  ) {}

  async executar(imagemId: string): Promise<void> {
    const imagem = await this.imagemProdutoRepository.buscarPorId(imagemId);
    if (!imagem) {
      throw new ImagemProdutoNaoEncontradaException(imagemId);
    }

    await this.imageStorage.remover(imagem.providerId);
    await this.imagemProdutoRepository.excluir(imagemId);
  }
}
