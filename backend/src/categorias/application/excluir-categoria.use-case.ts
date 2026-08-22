import { Injectable } from '@nestjs/common';
import { CategoriaRepository } from '../domain/categoria.repository';
import {
  CategoriaComProdutosVinculadosException,
  CategoriaNaoEncontradaException,
} from '../domain/categorias.exceptions';

@Injectable()
export class ExcluirCategoriaUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async executar(id: string): Promise<void> {
    const existente = await this.categoriaRepository.buscarPorId(id);
    if (!existente) {
      throw new CategoriaNaoEncontradaException(id);
    }

    if (await this.categoriaRepository.possuiProdutosVinculados(id)) {
      throw new CategoriaComProdutosVinculadosException(id);
    }

    await this.categoriaRepository.excluir(id);
  }
}
