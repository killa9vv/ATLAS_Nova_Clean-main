// Módulo raiz: registra config global, Prisma e os módulos de domínio (produtos, carrinho, pedidos, pagamentos).
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { ProdutosModule } from './produtos/infrastructure/produtos.module';
import { CarrinhoModule } from './carrinho/infrastructure/carrinho.module';
import { PedidosModule } from './pedidos/infrastructure/pedidos.module';
import { PagamentosModule } from './pagamentos/infrastructure/pagamentos.module';
import { AuthModule } from './auth/infrastructure/auth.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProdutosModule,
    CarrinhoModule,
    PedidosModule,
    PagamentosModule,
    AuthModule,
  ],
})
export class AppModule {}
