// Módulo Nest do carrinho: expõe o controller e o use case de montagem do carrinho.
import { Module } from '@nestjs/common';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { CarrinhoController } from './carrinho.controller';
import { MontarCarrinhoUseCase } from '../application/montar-carrinho.use-case';

@Module({
  imports: [ProdutosModule],
  controllers: [CarrinhoController],
  providers: [MontarCarrinhoUseCase],
  exports: [MontarCarrinhoUseCase],
})
export class CarrinhoModule {}
