// Precisa ser o primeiro import de main.ts: o SDK do Sentry instrumenta módulos do
// Node na inicialização, antes de o resto do app ser carregado.
import { iniciarSentry } from './shared/observability/sentry';

iniciarSentry();
