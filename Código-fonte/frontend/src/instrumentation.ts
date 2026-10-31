// Lado servidor do Next (renderização das páginas de produto, catálogo etc.) — ver
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md.
import * as Sentry from '@sentry/nextjs';
import { opcoesComuns } from '@/lib/sentry-config';

export function register() {
  Sentry.init(opcoesComuns);
}

// Erros de renderização/rotas no servidor do Next vão pro Sentry.
export const onRequestError = Sentry.captureRequestError;
