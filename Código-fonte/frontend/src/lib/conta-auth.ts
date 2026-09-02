const CHAVE_SESSAO = 'atlas_cliente_sessao';

export interface ClienteAutenticado {
  id: string;
  nome: string;
  email?: string;
}

export interface SessaoCliente {
  accessToken: string;
  refreshToken: string;
  cliente: ClienteAutenticado;
}

/**
 * Sessão da área do cliente guardada no localStorage do navegador — mesmo
 * padrão de admin-auth.ts. O gate de verdade é sempre o backend
 * (JwtAuthGuard/RolesGuard em cada rota /clientes/me* e /clientes/me/pedidos*);
 * isso aqui só evita que o front mostre tela protegida sem sessão e injeta o
 * Authorization header nas chamadas (ver contaApi em conta-api.ts).
 */
export function salvarSessaoCliente(sessao: SessaoCliente): void {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function obterSessaoCliente(): SessaoCliente | null {
  const bruto = localStorage.getItem(CHAVE_SESSAO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as SessaoCliente;
  } catch {
    return null;
  }
}

export function limparSessaoCliente(): void {
  localStorage.removeItem(CHAVE_SESSAO);
}

export function estaLogadoComoCliente(): boolean {
  return !!obterSessaoCliente();
}
