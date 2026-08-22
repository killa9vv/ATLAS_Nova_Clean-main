import { Injectable } from '@nestjs/common';
import { gerarSlug } from '../../shared/slug.util';
import { Categoria } from '../domain/categoria.entity';
import { CategoriaRepository } from '../domain/categoria.repository';

@Injectable()
export class CriarCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async executar(nome: string): Promise<Categoria> {
    const slug = await this.gerarSlugUnico(nome);
    return this.categoriaRepository.criar({ nome, slug });
  }

  /** Gera o slug a partir do nome e garante unicidade sufixando "-2", "-3"... se já existir. */
  private async gerarSlugUnico(nome: string): Promise<string> {
    const base = gerarSlug(nome);
    let slug = base;
    let tentativa = 1;

    while (await this.categoriaRepository.buscarPorSlug(slug)) {
      tentativa++;
      slug = `${base}-${tentativa}`;
    }

    return slug;
  }
}
