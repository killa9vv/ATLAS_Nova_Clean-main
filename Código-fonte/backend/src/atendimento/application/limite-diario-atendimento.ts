import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const LIMITE_PADRAO = 300;

/** Teto de mensagens por dia na loja inteira, pra um pico (ou abuso) não virar conta alta. Fica
 * em memória porque a API roda numa instância só; reiniciar zera a contagem, então o limite de
 * gasto no console da Anthropic continua sendo a trava definitiva. */
@Injectable()
export class LimiteDiarioAtendimento {
  private readonly limite: number;
  private dia = '';
  private contagem = 0;

  constructor(configService: ConfigService) {
    this.limite = Number(configService.get('ATENDIMENTO_LIMITE_DIARIO')) || LIMITE_PADRAO;
  }

  consumir(agora: Date = new Date()): boolean {
    const hoje = agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    if (hoje !== this.dia) {
      this.dia = hoje;
      this.contagem = 0;
    }
    if (this.contagem >= this.limite) return false;
    this.contagem += 1;
    return true;
  }
}
