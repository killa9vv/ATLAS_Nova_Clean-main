import { Injectable } from '@nestjs/common';
import { Categoria } from '../domain/categoria.entity';
import { CategoriaRepository } from '../domain/categoria.repository';
import { CategoriaNaoEncontradaException } from '../domain/categorias.exceptions';

@Injectable()
export class AtualizarCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async executar(id: string, nome: string): Promise<Categoria> {
    const existente = await this.categoriaRepository.buscarPorId(id);
    if (!existente) {
      throw new CategoriaNaoEncontradaException(id);
    }

    // O slug não muda depois de criado — evita quebrar links/filtros já em uso
    // que referenciam a categoria pelo slug.
    return this.categoriaRepository.atualizar(id, { nome });
  }
}
