import { api, ApiError } from '@/lib/http';
import { limparSessaoAdmin, obterSessaoAdmin } from '@/lib/admin-auth';

/**
 * Mesmo cliente HTTP de src/lib/http.ts, só que injeta o Authorization header
 * da sessão admin em toda chamada. Em 401 (token ausente/expirado) ou 403
 * (logado mas sem papel ADMIN), limpa a sessão local — quem chamou decide o
 * que fazer com o erro (normalmente redirecionar pra /admin/login).
 */
function authHeader(): HeadersInit {
  const sessao = obterSessaoAdmin();
  return sessao ? { Authorization: `Bearer ${sessao.accessToken}` } : {};
}

async function comAuth<T>(chamada: () => Promise<T>): Promise<T> {
  try {
    return await chamada();
  } catch (erro) {
    if (erro instanceof ApiError && (erro.status === 401 || erro.status === 403)) {
      limparSessaoAdmin();
    }
    throw erro;
  }
}

export const adminApi = {
  get: <T>(caminho: string) => comAuth(() => api.get<T>(caminho, { headers: authHeader() })),
  post: <T>(caminho: string, body?: unknown) =>
    comAuth(() => api.post<T>(caminho, body, { headers: authHeader() })),
  put: <T>(caminho: string, body?: unknown) =>
    comAuth(() => api.put<T>(caminho, body, { headers: authHeader() })),
  patch: <T>(caminho: string, body?: unknown) =>
    comAuth(() => api.patch<T>(caminho, body, { headers: authHeader() })),
  delete: <T>(caminho: string) => comAuth(() => api.delete<T>(caminho, { headers: authHeader() })),
};
