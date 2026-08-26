import { Injectable } from '@nestjs/common';
import { ImagemProdutoRepository } from '../domain/imagem-produto.repository';
import { ImagemProdutoNaoEncontradaException } from '../domain/produtos.exceptions';

@Injectable()
export class DefinirImagemPrincipalUseCase {
  constructor(private readonly imagemProdutoRepository: ImagemProdutoRepository) {}

  async executar(imagemId: string): Promise<void> {
    const imagem = await this.imagemProdutoRepository.buscarPorId(imagemId);
    if (!imagem) {
      throw new ImagemProdutoNaoEncontradaException(imagemId);
    }

    if (imagem.ehPrincipal()) {
      return;
    }

    await this.imagemProdutoRepository.definirComoPrincipal(imagem);
  }
}
