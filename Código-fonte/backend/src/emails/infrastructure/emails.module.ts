import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { PrismaPedidoRepository } from '../../pedidos/infrastructure/prisma-pedido.repository';
import { EmailSender } from '../domain/email-sender.port';
import { EmailQueuePort } from '../domain/email-queue.port';
import { EmailEnviadoRepository } from '../domain/email-enviado.repository';
import { ResendEmailSenderAdapter } from './resend-email-sender.adapter';
import { NullEmailSenderAdapter } from './null-email-sender.adapter';
import { BullmqEmailQueueAdapter } from './bullmq-email-queue.adapter';
import { EnvioDiretoEmailQueueAdapter } from './envio-direto-email-queue.adapter';
import { PrismaEmailEnviadoRepository } from './prisma-email-enviado.repository';
import { EmailProcessor } from './email.processor';
import { ProcessarEmailUseCase } from '../application/processar-email.use-case';
import { FILA_EMAILS } from './emails.constants';
import { montarConexaoRedis, redisConfigurado } from '../../shared/config/montar-conexao-redis';

// PedidosModule e ClientesModule precisam de EmailQueuePort (pra enfileirar), e
// ProcessarEmailUseCase precisa de PedidoRepository (pra buscar o pedido fresco no
// worker) — importar PedidosModule aqui fecharia um ciclo (Pedidos -> Clientes ->
// Emails -> Pedidos). Em vez de forwardRef, este módulo registra seu próprio
// binding de PedidoRepository (PrismaPedidoRepository só depende de PrismaService,
// que é global) — evita o ciclo sem acoplar os módulos entre si.
const PROVIDERS_COMUNS: Provider[] = [
  { provide: PedidoRepository, useClass: PrismaPedidoRepository },
  {
    provide: EmailSender,
    useFactory: (configService: ConfigService) => {
      const apiKey = configService.get<string>('RESEND_API_KEY');
      return apiKey ? new ResendEmailSenderAdapter(configService) : new NullEmailSenderAdapter();
    },
    inject: [ConfigService],
  },
  { provide: EmailEnviadoRepository, useClass: PrismaEmailEnviadoRepository },
  ProcessarEmailUseCase,
];

// maxRetriesPerRequest baixo + offline queue desligada: se o Redis estiver fora do
// ar, enfileirar um e-mail falha rápido em vez de travar a requisição HTTP esperando
// reconexão — BullmqEmailQueueAdapter já captura esse erro e só loga (ver EmailQueuePort).
//
// retryStrategy é o que efetivamente limita o worker de e-mails (EmailProcessor):
// o BullMQ força maxRetriesPerRequest=null na conexão de bloqueio do worker (é
// exigência da própria lib pra comandos bloqueantes, ignora o valor acima só pra
// essa conexão) — sem isso, ioredis reconecta pra sempre e `app.close()` trava
// esperando o worker fechar. Retornar null depois de poucas tentativas faz o
// ioredis desistir e emitir erro em vez de retry infinito.
const BULL_ROOT = BullModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    connection: {
      ...montarConexaoRedis({
        redisUrl: configService.get<string>('REDIS_URL'),
        redisHost: configService.get<string>('REDIS_HOST'),
        redisPort: configService.get<number>('REDIS_PORT'),
      }),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      retryStrategy: (tentativas: number) =>
        tentativas > 3 ? null : Math.min(tentativas * 200, 2_000),
    },
  }),
});

@Module({})
export class EmailsModule {
  /**
   * Global: PedidosModule, PagamentosModule e ClientesModule recebem EmailQueuePort
   * sem importar este módulo. Com Redis configurado, e-mails passam pela fila do
   * BullMQ (com retentativas); sem Redis, são enviados na hora pelo
   * EnvioDiretoEmailQueueAdapter — nenhuma conexão com Redis é aberta.
   *
   * Espera ConfigModule.envVariablesLoaded antes de decidir: ler process.env direto
   * na avaliação do módulo pegaria o ambiente antes do dotenv carregar o .env (mesmo
   * problema documentado em AuthModule).
   */
  static async forRoot(): Promise<DynamicModule> {
    await ConfigModule.envVariablesLoaded;
    const usarFila = redisConfigurado(process.env);

    return {
      module: EmailsModule,
      global: true,
      imports: usarFila
        ? [ConfigModule, BULL_ROOT, BullModule.registerQueue({ name: FILA_EMAILS })]
        : [ConfigModule],
      providers: [
        ...PROVIDERS_COMUNS,
        ...(usarFila
          ? [{ provide: EmailQueuePort, useClass: BullmqEmailQueueAdapter }, EmailProcessor]
          : [{ provide: EmailQueuePort, useClass: EnvioDiretoEmailQueueAdapter }]),
      ],
      exports: [EmailQueuePort],
    };
  }
}
