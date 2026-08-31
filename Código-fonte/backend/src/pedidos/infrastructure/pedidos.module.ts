import { Module } from '@nestjs/common';
import { CarrinhoModule } from '../../carrinho/infrastructure/carrinho.module';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { FreteModule } from '../../frete/infrastructure/frete.module';
import { ClientesModule } from '../../clientes/infrastructure/clientes.module';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';
import { ListarPedidosUseCase } from '../application/listar-pedidos.use-case';
import { AtualizarStatusPedidoUseCase } from '../application/atualizar-status-pedido.use-case';
import { AtualizarRastreioPedidoUseCase } from '../application/atualizar-rastreio-pedido.use-case';
import { PedidoRepository } from '../domain/pedido.repository';
import { PedidosController } from './pedidos.controller';
import { PrismaPedidoRepository } from './prisma-pedido.repository';

@Module({
  imports: [CarrinhoModule, ProdutosModule, FreteModule, ClientesModule],
  controllers: [PedidosController],
  providers: [
    {
      provide: PedidoRepository,
      useClass: PrismaPedidoRepository,
    },
    CriarPedidoUseCase,
    BuscarPedidoPorIdUseCase,
    ListarPedidosUseCase,
    AtualizarStatusPedidoUseCase,
    AtualizarRastreioPedidoUseCase,
  ],
  exports: [PedidoRepository],
})
export class PedidosModule {}
