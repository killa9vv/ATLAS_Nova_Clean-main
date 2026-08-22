import { Module } from '@nestjs/common';
import { CarrinhoModule } from '../../carrinho/infrastructure/carrinho.module';
import { PedidosController } from './pedidos.controller';
import { PrismaPedidoRepository } from './prisma-pedido.repository';
import { PedidoRepository } from '../domain/pedido.repository';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';

@Module({
  imports: [CarrinhoModule],
  controllers: [PedidosController],
  providers: [
    { provide: PedidoRepository, useClass: PrismaPedidoRepository },
    CriarPedidoUseCase,
    BuscarPedidoPorIdUseCase,
  ],
  exports: [PedidoRepository],
})
export class PedidosModule {}
