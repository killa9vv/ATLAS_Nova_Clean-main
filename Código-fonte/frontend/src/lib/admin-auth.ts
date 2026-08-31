const CHAVE_SESSAO = 'atlas_admin_sessao';

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  papel: 'ADMIN' | 'CLIENTE';
}

export interface SessaoAdmin {
  accessToken: string;
  usuario: UsuarioAdmin;
}

/**
 * Sessão do painel admin guardada no localStorage do navegador. O gate de
 * verdade é sempre o backend (JwtAuthGuard/RolesGuard em cada rota admin) —
 * isso aqui só evita que o front mostre telas protegidas sem um token válido
 * e injeta o Authorization header nas chamadas (ver adminApi em admin-api.ts).
 */
export function salvarSessaoAdmin(sessao: SessaoAdmin): void {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function obterSessaoAdmin(): SessaoAdmin | null {
  const bruto = localStorage.getItem(CHAVE_SESSAO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as SessaoAdmin;
  } catch {
    return null;
  }
}

export function limparSessaoAdmin(): void {
  localStorage.removeItem(CHAVE_SESSAO);
}

export function estaLogadoComoAdmin(): boolean {
  return obterSessaoAdmin()?.usuario.papel === 'ADMIN';
}
