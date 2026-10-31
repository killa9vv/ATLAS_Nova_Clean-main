import * as Sentry from '@sentry/nestjs';
import type { ErrorEvent } from '@sentry/nestjs';

/**
 * Monitoramento de erros (Sentry). Opcional: sem SENTRY_DSN nada é enviado e o
 * resto do app funciona igual (dev local, testes, CI).
 *
 * Só erros de verdade chegam aqui — tudo que passa por logger.error (ver
 * PinoLoggerService.error): respostas 5xx do GlobalExceptionFilter e falhas que o
 * app registra e segue em frente (e-mail que não saiu, pagamento aprovado sem
 * estoque, reconciliação que falhou). Erros esperados (4xx: validação, senha
 * errada, cupom inválido) nunca são logados como erro, então não viram alerta.
 */
export function iniciarSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  // Uma linha no log da subida (sem mostrar o DSN) pra conferir no host se o
  // monitoramento está mesmo ligado — roda antes do logger do Nest existir.
  if (!dsn) {
    console.log('[sentry] desligado (SENTRY_DSN não configurado)');
    return;
  }

  Sentry.init({
    dsn,
    // SENTRY_DEBUG=true no host mostra no log o que o SDK está fazendo (envios,
    // erros de DSN/rede) — só pra diagnosticar, deixar desligado no dia a dia.
    debug: process.env.SENTRY_DEBUG === 'true',
    environment: process.env.NODE_ENV ?? 'development',
    // O padrão do SDK (v11) coleta corpo das requisições, cookies, headers, query e
    // dados do usuário — aqui passam senha, CPF, endereço e tokens. Tudo desligado:
    // o erro chega com mensagem, stack e rota, sem dado pessoal.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    // Só erros; sem rastreamento de desempenho (economiza a cota grátis).
    tracesSampleRate: 0,
    beforeSend: (evento) => limparDadosPessoais(evento),
  });
  console.log(
    Sentry.isEnabled()
      ? '[sentry] ligado'
      : '[sentry] NÃO ligou — confira o valor de SENTRY_DSN (ou use SENTRY_DEBUG=true)',
  );
}

const REGEX_EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const REGEX_CPF_CNPJ = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const REGEX_TOKEN_URL = /([?&](token|access_token|refresh_token)=)[^&#\s]+/gi;

function limparTexto(texto: string): string {
  return texto
    .replace(REGEX_EMAIL, '[email]')
    .replace(REGEX_CPF_CNPJ, '[documento]')
    .replace(REGEX_TOKEN_URL, '$1[removido]');
}

/**
 * Última barreira antes de enviar: tira corpo da requisição, cookies e headers de
 * autenticação, e mascara e-mail, CPF/CNPJ e tokens em mensagens e URLs (ex.: o
 * erro do Resend costuma citar o destinatário).
 */
export function limparDadosPessoais(evento: ErrorEvent): ErrorEvent {
  if (evento.request) {
    delete evento.request.data;
    delete evento.request.cookies;
    if (evento.request.headers) {
      for (const nome of Object.keys(evento.request.headers)) {
        if (/^(authorization|cookie|x-cart-session)$/i.test(nome)) {
          delete evento.request.headers[nome];
        }
      }
    }
    if (evento.request.url) evento.request.url = limparTexto(evento.request.url);
    if (typeof evento.request.query_string === 'string') {
      evento.request.query_string = limparTexto(evento.request.query_string);
    }
  }
  delete evento.user;

  if (evento.message) evento.message = limparTexto(evento.message);
  for (const excecao of evento.exception?.values ?? []) {
    if (excecao.value) excecao.value = limparTexto(excecao.value);
  }
  return evento;
}

/**
 * Chamado por PinoLoggerService.error. Aceita os formatos que chegam no logger:
 * Error, o objeto estruturado do GlobalExceptionFilter (com `exception`) ou texto
 * (Logger do Nest: `logger.error(mensagem, stack?, contexto?)`).
 */
export function reportarErroAoSentry(mensagem: unknown, parametros: unknown[]): void {
  if (!Sentry.isEnabled()) return;

  const contexto =
    parametros.length > 0 && typeof parametros[parametros.length - 1] === 'string'
      ? (parametros[parametros.length - 1] as string)
      : undefined;
  const tags = contexto ? { contexto } : undefined;

  if (mensagem instanceof Error) {
    Sentry.captureException(mensagem, { tags });
    return;
  }

  if (typeof mensagem === 'object' && mensagem !== null) {
    const dados = mensagem as {
      exception?: { name?: string; message?: string; stack?: string };
      requestId?: string;
      path?: string;
      statusCode?: number;
      erro?: string;
    };
    if (dados.exception?.message) {
      const erro = new Error(dados.exception.message);
      erro.name = dados.exception.name ?? 'Error';
      if (dados.exception.stack) erro.stack = dados.exception.stack;
      Sentry.captureException(erro, {
        tags: {
          ...tags,
          ...(dados.erro ? { erro: dados.erro } : {}),
          ...(dados.statusCode ? { statusCode: String(dados.statusCode) } : {}),
        },
        extra: { requestId: dados.requestId, path: dados.path },
      });
      return;
    }
  }

  const texto = typeof mensagem === 'string' ? mensagem : 'Erro registrado no log';
  Sentry.captureMessage(texto, { level: 'error', tags });
}
