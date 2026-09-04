import { Module } from '@nestjs/common';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { CuponsModule } from '../../cupons/infrastructure/cupons.module';
import { CarrinhoController } from './carrinho.controller';
import { MontarCarrinhoUseCase } from '../application/montar-carrinho.use-case';

@Module({
  imports: [ProdutosModule, CuponsModule],
  controllers: [CarrinhoController],
  providers: [MontarCarrinhoUseCase],
  exports: [MontarCarrinhoUseCase],
})
export class CarrinhoModule {}
