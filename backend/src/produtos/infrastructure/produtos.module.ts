import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { PrismaProdutoRepository } from './prisma-produto.repository';
import { ProdutoRepository } from '../domain/produto.repository';
import { ListarProdutosUseCase } from '../application/listar-produtos.use-case';
import { BuscarProdutoPorIdUseCase } from '../application/buscar-produto-por-id.use-case';
import { BuscarProdutoPorSlugUseCase } from '../application/buscar-produto-por-slug.use-case';
import { CriarProdutoUseCase } from '../application/criar-produto.use-case';
import { AtualizarProdutoUseCase } from '../application/atualizar-produto.use-case';
import { AlternarStatusProdutoUseCase } from '../application/alternar-status-produto.use-case';

@Module({
  controllers: [ProdutosController],
  providers: [
    { provide: ProdutoRepository, useClass: PrismaProdutoRepository },
    ListarProdutosUseCase,
    BuscarProdutoPorIdUseCase,
    BuscarProdutoPorSlugUseCase,
    CriarProdutoUseCase,
    AtualizarProdutoUseCase,
    AlternarStatusProdutoUseCase,
  ],
  exports: [ProdutoRepository],
})
export class ProdutosModule {}
