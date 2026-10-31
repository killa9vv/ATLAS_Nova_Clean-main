// Roda no navegador antes da página ficar interativa (convenção do Next — ver
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md).
// Captura erros de JavaScript no navegador do cliente (ex.: o formulário do Mercado
// Pago que não carrega) e manda pro Sentry.
import * as Sentry from '@sentry/nextjs';
import { opcoesComuns } from '@/lib/sentry-config';

try {
  Sentry.init(opcoesComuns);
} catch {
  // Monitoramento nunca pode derrubar a loja.
}
