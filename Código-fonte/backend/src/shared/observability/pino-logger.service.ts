import { Injectable, LoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';
import { reportarErroAoSentry } from './sentry';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      base: {
        service: 'atlas-nova-clean-api',
        environment: process.env.NODE_ENV ?? 'development',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.info(this.criarObjeto(message, optionalParams));
  }

  // Todo logger.error do app (Logger do Nest incluso, via app.useLogger) passa por
  // aqui — por isso é o único ponto que manda erro pro Sentry (ver sentry.ts).
  error(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.error(this.criarObjeto(message, optionalParams));
    reportarErroAoSentry(message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.warn(this.criarObjeto(message, optionalParams));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.debug(this.criarObjeto(message, optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.logger.trace(this.criarObjeto(message, optionalParams));
  }

  private criarObjeto(message: unknown, optionalParams: unknown[]): Record<string, unknown> {
    const contexto =
      optionalParams.length > 0 && typeof optionalParams[optionalParams.length - 1] === 'string'
        ? optionalParams[optionalParams.length - 1]
        : undefined;

    if (message instanceof Error) {
      return {
        msg: message.message,
        err: {
          name: message.name,
          message: message.message,
          stack: message.stack,
        },
        ...(contexto ? { context: contexto } : {}),
      };
    }

    return {
      msg: typeof message === 'string' ? message : 'Log da aplicacao',
      ...(typeof message === 'object' && message !== null ? { data: message } : {}),
      ...(contexto ? { context: contexto } : {}),
    };
  }
}
