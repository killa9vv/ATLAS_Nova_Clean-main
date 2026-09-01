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
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    // Limite padrão pra API inteira; rotas sensíveis (ex: login) sobrescrevem
    // com @Throttle() um limite mais estrito.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    // Habilita @Cron — usado hoje só pelo job de reconciliação de pagamentos pendentes.
    ScheduleModule.forRoot(),
    PrismaModule,
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
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
