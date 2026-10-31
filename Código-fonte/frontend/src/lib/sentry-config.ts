import type { Breadcrumb, ErrorEvent } from '@sentry/nextjs';

// Configuração comum do Sentry (navegador e servidor do Next) — ver
// instrumentation-client.ts e instrumentation.ts. Sem NEXT_PUBLIC_SENTRY_DSN o SDK
// fica desligado (dev local, build sem a variável).

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

const REGEX_EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const REGEX_CPF_CNPJ = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
// Links de ativação de conta e de redefinir senha levam o token na URL.
const REGEX_TOKEN_URL = /([?&](token|access_token|refresh_token)=)[^&#\s]+/gi;

function limparTexto(texto: string): string {
  return texto
    .replace(REGEX_EMAIL, '[email]')
    .replace(REGEX_CPF_CNPJ, '[documento]')
    .replace(REGEX_TOKEN_URL, '$1[removido]');
}

export const opcoesComuns = {
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Só erros — sem rastreamento de desempenho nem gravação de sessão (economiza a
  // cota grátis e não grava o que o cliente digita).
  tracesSampleRate: 0,
  // O padrão do SDK (v11) coleta corpo, cookies, headers, query e dados do usuário.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
  beforeSend(evento: ErrorEvent): ErrorEvent {
    if (evento.request) {
      delete evento.request.data;
      delete evento.request.cookies;
      delete evento.request.headers;
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
  },
  // "Rastro" do que aconteceu antes do erro (navegação, cliques, requisições):
  // URLs e mensagens de console também podem ter token/e-mail.
  beforeBreadcrumb(rastro: Breadcrumb): Breadcrumb {
    if (rastro.message) rastro.message = limparTexto(rastro.message);
    if (rastro.data) {
      for (const chave of ['url', 'from', 'to']) {
        const valor = rastro.data[chave];
        if (typeof valor === 'string') rastro.data[chave] = limparTexto(valor);
      }
    }
    return rastro;
  },
};
