import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';

/** Apaga carrinhos abandonados (expiraEm vencido — ver TTL_CARRINHO_DIAS em
 * resolver-carrinho-sessao.use-case.ts) diariamente. */
@Injectable()
export class LimpezaCarrinhosScheduler {
  private readonly logger = new Logger(LimpezaCarrinhosScheduler.name);

  constructor(private readonly carrinhoSessaoRepository: CarrinhoSessaoRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async executar(): Promise<void> {
    try {
      const removidos = await this.carrinhoSessaoRepository.deletarExpirados(new Date());
      this.logger.log(`Limpeza de carrinhos expirados: ${removidos} removido(s).`);
    } catch (erro) {
      this.logger.error(
        `Job de limpeza de carrinhos falhou: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
    }
  }
}
