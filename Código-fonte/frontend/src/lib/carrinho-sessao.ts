const CHAVE_SESSION_TOKEN = 'atlas-carrinho-sessao';

/** Token opaco do carrinho anônimo (ver backend: shared/token.util.ts,
 * Carrinho.sessionToken) — chave própria, diferente da antiga `atlas-carrinho` que
 * guardava o array de itens do carrinho 100% local (esse conceito não existe mais). */
export function obterSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CHAVE_SESSION_TOKEN);
}

export function salvarSessionToken(valor: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHAVE_SESSION_TOKEN, valor);
}

export function cartSessionHeader(): HeadersInit {
  const token = obterSessionToken();
  return token ? { 'X-Cart-Session': token } : {};
}
