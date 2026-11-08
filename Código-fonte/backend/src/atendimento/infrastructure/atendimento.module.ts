import { Module } from '@nestjs/common';
import { PedidosModule } from '../../pedidos/infrastructure/pedidos.module';
import { ProdutosModule } from '../../produtos/infrastructure/produtos.module';
import { FerramentasAtendimento } from '../application/ferramentas-atendimento';
import { LimiteDiarioAtendimento } from '../application/limite-diario-atendimento';
import { ResponderAtendimentoUseCase } from '../application/responder-atendimento.use-case';
import { ModeloAtendimento } from '../domain/modelo-atendimento';
import { AtendimentoController } from '../presentation/atendimento.controller';
import { AnthropicModeloAtendimento } from './anthropic-modelo-atendimento';

@Module({
  imports: [ProdutosModule, PedidosModule],
  controllers: [AtendimentoController],
  providers: [
    { provide: ModeloAtendimento, useClass: AnthropicModeloAtendimento },
    FerramentasAtendimento,
    LimiteDiarioAtendimento,
    ResponderAtendimentoUseCase,
  ],
})
export class AtendimentoModule {}
