import { Module } from '@nestjs/common';
import { CarrinhoModule } from '../../carrinho/infrastructure/carrinho.module';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { FreteModule } from '../../frete/infrastructure/frete.module';
import { ClientesModule } from '../../clientes/infrastructure/clientes.module';
import { CuponsModule } from '../../cupons/infrastructure/cupons.module';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';
import { ListarPedidosUseCase } from '../application/listar-pedidos.use-case';
import { ListarPedidosPorClienteUseCase } from '../application/listar-pedidos-por-cliente.use-case';
import { BuscarPedidoDoClienteUseCase } from '../application/buscar-pedido-do-cliente.use-case';
import { BuscarRastreioPedidoUseCase } from '../application/buscar-rastreio-pedido.use-case';
import { RepetirPedidoUseCase } from '../application/repetir-pedido.use-case';
import { AtualizarStatusPedidoUseCase } from '../application/atualizar-status-pedido.use-case';
import { AtualizarRastreioPedidoUseCase } from '../application/atualizar-rastreio-pedido.use-case';
import { PedidoRepository } from '../domain/pedido.repository';
import { PedidosController } from './pedidos.controller';
import { PedidosClienteController } from './pedidos-cliente.controller';
import { PrismaPedidoRepository } from './prisma-pedido.repository';

@Module({
  imports: [CarrinhoModule, ProdutosModule, FreteModule, ClientesModule, CuponsModule],
  controllers: [PedidosController, PedidosClienteController],
  providers: [
    {
      provide: PedidoRepository,
      useClass: PrismaPedidoRepository,
    },
    CriarPedidoUseCase,
    BuscarPedidoPorIdUseCase,
    ListarPedidosUseCase,
    ListarPedidosPorClienteUseCase,
    BuscarPedidoDoClienteUseCase,
    BuscarRastreioPedidoUseCase,
    RepetirPedidoUseCase,
    AtualizarStatusPedidoUseCase,
    AtualizarRastreioPedidoUseCase,
  ],
  exports: [PedidoRepository],
})
export class PedidosModule {}
