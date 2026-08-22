import { Module } from '@nestjs/common';
import { ProdutosController } from './produtos.controller';
import { ImagensProdutoController } from './imagens-produto.controller';
import { PrismaProdutoRepository } from './prisma-produto.repository';
import { PrismaImagemProdutoRepository } from './prisma-imagem-produto.repository';
import { CloudinaryStorageAdapter } from './cloudinary-storage.adapter';
import { ProdutoRepository } from '../domain/produto.repository';
import { ImagemProdutoRepository } from '../domain/imagem-produto.repository';
import { ImageStorage } from '../domain/image-storage.port';
import { ListarProdutosUseCase } from '../application/listar-produtos.use-case';
import { BuscarProdutoPorIdUseCase } from '../application/buscar-produto-por-id.use-case';
import { BuscarProdutoPorSlugUseCase } from '../application/buscar-produto-por-slug.use-case';
import { CriarProdutoUseCase } from '../application/criar-produto.use-case';
import { AtualizarProdutoUseCase } from '../application/atualizar-produto.use-case';
import { AlternarStatusProdutoUseCase } from '../application/alternar-status-produto.use-case';
import { UploadImagemProdutoUseCase } from '../application/upload-imagem-produto.use-case';
import { ListarImagensProdutoUseCase } from '../application/listar-imagens-produto.use-case';
import { RemoverImagemProdutoUseCase } from '../application/remover-imagem-produto.use-case';
import { DefinirImagemPrincipalUseCase } from '../application/definir-imagem-principal.use-case';

@Module({
  controllers: [ProdutosController, ImagensProdutoController],
  providers: [
    { provide: ProdutoRepository, useClass: PrismaProdutoRepository },
    { provide: ImagemProdutoRepository, useClass: PrismaImagemProdutoRepository },
    { provide: ImageStorage, useClass: CloudinaryStorageAdapter },
    ListarProdutosUseCase,
    BuscarProdutoPorIdUseCase,
    BuscarProdutoPorSlugUseCase,
    CriarProdutoUseCase,
    AtualizarProdutoUseCase,
    AlternarStatusProdutoUseCase,
    UploadImagemProdutoUseCase,
    ListarImagensProdutoUseCase,
    RemoverImagemProdutoUseCase,
    DefinirImagemPrincipalUseCase,
  ],
  exports: [ProdutoRepository],
})
export class ProdutosModule {}
