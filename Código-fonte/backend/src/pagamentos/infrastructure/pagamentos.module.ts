import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PedidosModule } from '../../pedidos/infrastructure/pedidos.module';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { CuponsModule } from '../../cupons/infrastructure/cupons.module';
import { PagamentosController } from './pagamentos.controller';
import { PrismaPagamentoRepository } from './prisma-pagamento.repository';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway } from '../domain/payment-gateway.port';
import { MercadoPagoGatewayAdapter } from './gateways/mercado-pago-gateway.adapter';
import { CriarPagamentoUseCase } from '../application/criar-pagamento.use-case';
import { ProcessarWebhookUseCase } from '../application/processar-webhook.use-case';
import { ReconciliarPedidoService } from '../application/reconciliar-pedido.service';
import { ReconciliarPagamentosPendentesUseCase } from '../application/reconciliar-pagamentos-pendentes.use-case';
import { ReconciliacaoPagamentosScheduler } from './reconciliacao-pagamentos.scheduler';

@Module({
  imports: [ConfigModule, PedidosModule, ProdutosModule, CuponsModule],
  controllers: [PagamentosController],
  providers: [
    { provide: PagamentoRepository, useClass: PrismaPagamentoRepository },
    { provide: PaymentGateway, useClass: MercadoPagoGatewayAdapter },
    CriarPagamentoUseCase,
    ProcessarWebhookUseCase,
    ReconciliarPedidoService,
    ReconciliarPagamentosPendentesUseCase,
    ReconciliacaoPagamentosScheduler,
  ],
})
export class PagamentosModule {}
