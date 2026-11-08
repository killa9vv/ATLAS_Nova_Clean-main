import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { envValidationSchema } from './shared/config/env-validation.schema';
import { ProdutosModule } from './produtos/infrastructure/produtos.module';
import { CategoriasModule } from './categorias/infrastructure/categorias.module';
import { MarcasModule } from './marcas/infrastructure/marcas.module';
import { CarrinhoModule } from './carrinho/infrastructure/carrinho.module';
import { PedidosModule } from './pedidos/infrastructure/pedidos.module';
import { PagamentosModule } from './pagamentos/infrastructure/pagamentos.module';
import { AuthModule } from './auth/infrastructure/auth.module';
import { ClientesModule } from './clientes/infrastructure/clientes.module';
import { FreteModule } from './frete/infrastructure/frete.module';
import { CuponsModule } from './cupons/infrastructure/cupons.module';
import { BannersModule } from './banners/infrastructure/banners.module';
import { ResenhasModule } from './resenhas/infrastructure/resenhas.module';
import { AtendimentoModule } from './atendimento/infrastructure/atendimento.module';
import { EmailsModule } from './emails/infrastructure/emails.module';
import { ObservabilityModule } from './shared/observability/observability.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    ScheduleModule.forRoot(),
    // Fila de e-mails (BullMQ/Redis) é opcional — ver EmailsModule.forRoot.
    EmailsModule.forRoot(),
    PrismaModule,
    ObservabilityModule,
    HealthModule,
    ProdutosModule,
    CategoriasModule,
    MarcasModule,
    CarrinhoModule,
    PedidosModule,
    PagamentosModule,
    AuthModule,
    ClientesModule,
    FreteModule,
    CuponsModule,
    BannersModule,
    ResenhasModule,
    AtendimentoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
