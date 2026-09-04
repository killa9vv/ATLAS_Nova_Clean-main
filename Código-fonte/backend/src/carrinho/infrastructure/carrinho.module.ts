import { Module } from '@nestjs/common';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { CuponsModule } from '../../cupons/infrastructure/cupons.module';
import { CarrinhoController } from './carrinho.controller';
import { MontarCarrinhoUseCase } from '../application/montar-carrinho.use-case';
import { ResolverCarrinhoSessaoUseCase } from '../application/resolver-carrinho-sessao.use-case';
import { VisualizarCarrinhoUseCase } from '../application/visualizar-carrinho.use-case';
import { AdicionarItemCarrinhoUseCase } from '../application/adicionar-item-carrinho.use-case';
import { AtualizarQuantidadeItemCarrinhoUseCase } from '../application/atualizar-quantidade-item-carrinho.use-case';
import { RemoverItemCarrinhoUseCase } from '../application/remover-item-carrinho.use-case';
import { LimparCarrinhoUseCase } from '../application/limpar-carrinho.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { PrismaCarrinhoSessaoRepository } from './prisma-carrinho-sessao.repository';
import { LimpezaCarrinhosScheduler } from './limpeza-carrinhos.scheduler';

@Module({
  imports: [ProdutosModule, CuponsModule],
  controllers: [CarrinhoController],
  providers: [
    MontarCarrinhoUseCase,
    { provide: CarrinhoSessaoRepository, useClass: PrismaCarrinhoSessaoRepository },
    ResolverCarrinhoSessaoUseCase,
    VisualizarCarrinhoUseCase,
    AdicionarItemCarrinhoUseCase,
    AtualizarQuantidadeItemCarrinhoUseCase,
    RemoverItemCarrinhoUseCase,
    LimparCarrinhoUseCase,
    LimpezaCarrinhosScheduler,
  ],
  exports: [MontarCarrinhoUseCase],
})
export class CarrinhoModule {}
