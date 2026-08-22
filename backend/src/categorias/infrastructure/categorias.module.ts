import { Module } from '@nestjs/common';
import { CategoriasController } from './categorias.controller';
import { PrismaCategoriaRepository } from './prisma-categoria.repository';
import { CategoriaRepository } from '../domain/categoria.repository';
import { ListarCategoriasUseCase } from '../application/listar-categorias.use-case';
import { CriarCategoriaUseCase } from '../application/criar-categoria.use-case';
import { AtualizarCategoriaUseCase } from '../application/atualizar-categoria.use-case';
import { ExcluirCategoriaUseCase } from '../application/excluir-categoria.use-case';

@Module({
  controllers: [CategoriasController],
  providers: [
    { provide: CategoriaRepository, useClass: PrismaCategoriaRepository },
    ListarCategoriasUseCase,
    CriarCategoriaUseCase,
    AtualizarCategoriaUseCase,
    ExcluirCategoriaUseCase,
  ],
  exports: [CategoriaRepository],
})
export class CategoriasModule {}
