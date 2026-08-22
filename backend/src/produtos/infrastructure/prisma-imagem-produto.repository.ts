import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ImagemProduto } from '../domain/imagem-produto.entity';
import {
  DadosCriacaoImagemProduto,
  ImagemProdutoRepository,
} from '../domain/imagem-produto.repository';
import type { ImagemProduto as ImagemProdutoPrisma } from '@prisma/client';

@Injectable()
export class PrismaImagemProdutoRepository extends ImagemProdutoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarPorProduto(produtoId: string): Promise<ImagemProduto[]> {
    const imagens = await this.prisma.imagemProduto.findMany({
      where: { produtoId },
      orderBy: { ordem: 'asc' },
    });
    return imagens.map((imagem) => this.paraDominio(imagem));
  }

  async buscarPorId(id: string): Promise<ImagemProduto | null> {
    const imagem = await this.prisma.imagemProduto.findUnique({ where: { id } });
    return imagem ? this.paraDominio(imagem) : null;
  }

  async contarPorProduto(produtoId: string): Promise<number> {
    return this.prisma.imagemProduto.count({ where: { produtoId } });
  }

  async criar(dados: DadosCriacaoImagemProduto): Promise<ImagemProduto> {
    const imagem = await this.prisma.imagemProduto.create({
      data: {
        produtoId: dados.produtoId,
        url: dados.url,
        providerId: dados.providerId,
        ordem: dados.ordem,
      },
    });
    return this.paraDominio(imagem);
  }

  async excluir(id: string): Promise<void> {
    await this.prisma.imagemProduto.delete({ where: { id } });
  }

  async definirComoPrincipal(imagem: ImagemProduto): Promise<void> {
    const principalAtual = await this.prisma.imagemProduto.findFirst({
      where: { produtoId: imagem.produtoId, ordem: 0 },
    });

    await this.prisma.$transaction(async (tx) => {
      // Troca de lugar com a principal atual, se existir uma diferente da imagem alvo.
      if (principalAtual && principalAtual.id !== imagem.id) {
        await tx.imagemProduto.update({
          where: { id: principalAtual.id },
          data: { ordem: imagem.ordem },
        });
      }
      await tx.imagemProduto.update({ where: { id: imagem.id }, data: { ordem: 0 } });
    });
  }

  private paraDominio(imagem: ImagemProdutoPrisma): ImagemProduto {
    return new ImagemProduto(
      imagem.id,
      imagem.produtoId,
      imagem.url,
      imagem.providerId,
      imagem.ordem,
    );
  }
}
