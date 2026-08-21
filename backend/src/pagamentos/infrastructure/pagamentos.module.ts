import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PedidosModule } from '../../pedidos/infrastructure/pedidos.module';
import { PagamentosController } from './pagamentos.controller';
import { PrismaPagamentoRepository } from './prisma-pagamento.repository';
import { PagamentoRepository } from '../domain/pagamento.repository';
import { PaymentGateway } from '../domain/payment-gateway.port';
import { MercadoPagoGatewayAdapter } from './gateways/mercado-pago-gateway.adapter';
import { CriarPagamentoUseCase } from '../application/criar-pagamento.use-case';
import { ProcessarWebhookUseCase } from '../application/processar-webhook.use-case';

@Module({
  imports: [ConfigModule, PedidosModule],
  controllers: [PagamentosController],
  providers: [
    { provide: PagamentoRepository, useClass: PrismaPagamentoRepository },
    { provide: PaymentGateway, useClass: MercadoPagoGatewayAdapter },
    CriarPagamentoUseCase,
    ProcessarWebhookUseCase,
  ],
})
export class PagamentosModule {}
