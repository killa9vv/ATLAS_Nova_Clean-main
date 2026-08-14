// Módulo Nest de produtos: liga a porta ProdutoRepository à implementação Prisma e expõe os use cases.
import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { PrismaProdutoRepository } from './prisma-produto.repository';
import { ProdutoRepository } from '../domain/produto.repository';
import { ListarProdutosUseCase } from '../application/listar-produtos.use-case';
import { BuscarProdutoPorIdUseCase } from '../application/buscar-produto-por-id.use-case';

@Module({
  controllers: [ProdutosController],
  providers: [
    { provide: ProdutoRepository, useClass: PrismaProdutoRepository },
    ListarProdutosUseCase,
    BuscarProdutoPorIdUseCase,
  ],
  exports: [ProdutoRepository],
})
export class ProdutosModule {}
