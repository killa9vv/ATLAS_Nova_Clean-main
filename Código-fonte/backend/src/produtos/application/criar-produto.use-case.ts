import { Injectable } from '@nestjs/common';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import { CriarProdutoDto } from '../infrastructure/dto/criar-produto.dto';
import { gerarSlug } from '../../shared/slug.util';

@Injectable()
export class CriarProdutoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(dto: CriarProdutoDto): Promise<Produto> {
    const slug = await this.gerarSlugUnico(dto.nome);

    return this.produtoRepository.criar({
      nome: dto.nome,
      slug,
      preco: dto.preco,
      estoque: dto.estoque ?? 0,
      descricao: dto.descricao,
      categoria: dto.categoria,
      pesoKg: dto.pesoKg,
      alturaCm: dto.alturaCm,
      larguraCm: dto.larguraCm,
      comprimentoCm: dto.comprimentoCm,
    });
  }

  /** Gera o slug a partir do nome e garante unicidade sufixando "-2", "-3"... se já existir. */
  private async gerarSlugUnico(nome: string): Promise<string> {
    const base = gerarSlug(nome);
    let slug = base;
    let tentativa = 1;

    while (await this.produtoRepository.buscarPorSlug(slug)) {
      tentativa++;
      slug = `${base}-${tentativa}`;
    }

    return slug;
  }
}
