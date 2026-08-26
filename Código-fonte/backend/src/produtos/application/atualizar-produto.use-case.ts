import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../domain/produtos.exceptions';
import { AtualizarProdutoDto } from '../infrastructure/dto/atualizar-produto.dto';
import { gerarSlug } from '../../shared/slug.util';

@Injectable()
export class AtualizarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(id: string, dto: AtualizarProdutoDto): Promise<Produto> {
    const existente = await this.produtoRepository.buscarPorId(id);
    if (!existente) {
      throw new ProdutoNaoEncontradoException(id);
    }

    // Se o nome mudou, regenera o slug (mantendo unicidade); senão preserva o slug atual.
    let slug = existente.slug;
    if (dto.nome && dto.nome !== existente.nome) {
      slug = await this.gerarSlugUnico(dto.nome, id);
    }

    return this.produtoRepository.atualizar(id, {
      nome: dto.nome,
      slug,
      preco: dto.preco,
      estoque: dto.estoque,
      descricao: dto.descricao,
      categoria: dto.categoria,
    });
  }

  private async gerarSlugUnico(nome: string, idAtual: string): Promise<string> {
    const base = gerarSlug(nome);
    let slug = base;
    let tentativa = 1;

    while (true) {
      const existente = await this.produtoRepository.buscarPorSlug(slug);
      if (!existente || existente.id === idAtual) break;
      tentativa++;
      slug = `${base}-${tentativa}`;
    }

    return slug;
  }
}
