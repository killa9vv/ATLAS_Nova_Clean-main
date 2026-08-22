import { Injectable } from '@nestjs/common';
import { ImageStorage } from '../domain/image-storage.port';
import { ImagemProduto } from '../domain/imagem-produto.entity';
import { ImagemProdutoRepository } from '../domain/imagem-produto.repository';
import { ProdutoRepository } from '../domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../domain/produtos.exceptions';

const PASTA_IMAGENS_PRODUTO = 'atlas-nova-clean/produtos';

@Injectable()
export class UploadImagemProdutoUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository,
    private readonly imagemProdutoRepository: ImagemProdutoRepository,
    private readonly imageStorage: ImageStorage,
  ) {}

  async executar(produtoId: string, arquivo: Buffer): Promise<ImagemProduto> {
    const produto = await this.produtoRepository.buscarPorId(produtoId);
    if (!produto) {
      throw new ProdutoNaoEncontradoException(produtoId);
    }

    const resultado = await this.imageStorage.upload(arquivo, PASTA_IMAGENS_PRODUTO);

    // A primeira imagem do produto vira a principal (ordem 0) automaticamente;
    // as seguintes vão pro fim da fila.
    const ordem = await this.imagemProdutoRepository.contarPorProduto(produtoId);

    return this.imagemProdutoRepository.criar({
      produtoId,
      url: resultado.url,
      providerId: resultado.providerId,
      ordem,
    });
  }
}
