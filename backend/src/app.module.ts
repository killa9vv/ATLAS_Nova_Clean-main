import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { ProdutosModule } from './produtos/infrastructure/produtos.module';
import { CarrinhoModule } from './carrinho/infrastructure/carrinho.module';
import { PedidosModule } from './pedidos/infrastructure/pedidos.module';
import { PagamentosModule } from './pagamentos/infrastructure/pagamentos.module';
import { AuthModule } from './auth/infrastructure/auth.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite padrão pra API inteira; rotas sensíveis (ex: login) sobrescrevem
    // com @Throttle() um limite mais estrito.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    PrismaModule,
    ProdutosModule,
    CarrinhoModule,
    PedidosModule,
    PagamentosModule,
    AuthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
