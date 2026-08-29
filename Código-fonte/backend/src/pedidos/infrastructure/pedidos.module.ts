import { Module } from '@nestjs/common';
import { CarrinhoModule } from '../../carrinho/infrastructure/carrinho.module';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { FreteModule } from '../../frete/infrastructure/frete.module';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';
import { PedidoRepository } from '../domain/pedido.repository';
import { PedidosController } from './pedidos.controller';
import { PrismaPedidoRepository } from './prisma-pedido.repository';

@Module({
  imports: [CarrinhoModule, ProdutosModule, FreteModule],
  controllers: [PedidosController],
  providers: [
    {
      provide: PedidoRepository,
      useClass: PrismaPedidoRepository,
    },
    CriarPedidoUseCase,
    BuscarPedidoPorIdUseCase,
  ],
  exports: [PedidoRepository],
})
export class PedidosModule {}
