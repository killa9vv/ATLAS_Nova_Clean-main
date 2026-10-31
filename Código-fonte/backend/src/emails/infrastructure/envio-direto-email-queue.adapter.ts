import { Injectable, Logger } from '@nestjs/common';
import { EmailQueuePort } from '../domain/email-queue.port';
import { TarefaEmail } from '../domain/tarefa-email';
import { ProcessarEmailUseCase } from '../application/processar-email.use-case';

/**
 * Usado quando não há Redis configurado (ver EmailsModule.forRoot): em vez de
 * enfileirar, processa e envia o e-mail na hora, dentro da própria requisição.
 * Serve pra rodar sem custo de Redis (ex.: Railway sem serviço Redis) — perde só
 * as retentativas automáticas da fila; o resto (templates, dedup em EmailEnviado)
 * é o mesmo ProcessarEmailUseCase que o worker do BullMQ usa.
 *
 * Mesmo contrato de EmailQueuePort: nunca lança. Todas as chamadas já acontecem
 * depois da transação principal commitar, então falha no envio só é logada.
 */
@Injectable()
export class EnvioDiretoEmailQueueAdapter extends EmailQueuePort {
  private readonly logger = new Logger(EnvioDiretoEmailQueueAdapter.name);

  constructor(private readonly processarEmailUseCase: ProcessarEmailUseCase) {
    super();
  }

  async enfileirar(tarefa: TarefaEmail): Promise<void> {
    try {
      await this.processarEmailUseCase.executar(tarefa);
    } catch (erro) {
      this.logger.error(
        `Falha ao enviar e-mail do tipo ${tarefa.tipo}: ${(erro as Error).message}`,
      );
    }
  }
}
