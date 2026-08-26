import { Injectable } from '@nestjs/common';
import { Categoria } from '../domain/categoria.entity';
import { CategoriaRepository } from '../domain/categoria.repository';

@Injectable()
export class ListarCategoriasUseCase {
  constructor(private readonly categoriaRepository: CategoriaRepository) {}

  async executar(): Promise<Categoria[]> {
    return this.categoriaRepository.listarTodas();
  }
}
