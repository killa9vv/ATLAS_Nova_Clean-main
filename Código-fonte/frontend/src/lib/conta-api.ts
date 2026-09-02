import { api, ApiError } from '@/lib/http';
import { limparSessaoCliente, obterSessaoCliente, salvarSessaoCliente } from '@/lib/conta-auth';

interface RenovarTokenResponse {
  accessToken: string;
  refreshToken: string;
}

function authHeader(): HeadersInit {
  const sessao = obterSessaoCliente();
  return sessao ? { Authorization: `Bearer ${sessao.accessToken}` } : {};
}

// Diferente do admin (JWT de 1 dia, sem renovação): o access token do cliente
// dura só 1h de propósito, então uma sessão "normal" (alguém olhando pedidos
// antigos, editando endereço) esbarra em 401 por expiração com frequência real.
// Antes de desistir e limpar a sessão, tenta renovar uma vez com o refreshToken
// salvo (POST /auth/clientes/refresh, com rotação no backend) e repete a
// chamada original — só cai pro "limpa sessão" se o refresh também falhar.
let renovacaoEmAndamento: Promise<boolean> | null = null;

async function tentarRenovar(): Promise<boolean> {
  const sessaoAtual = obterSessaoCliente();
  if (!sessaoAtual) return false;

  // Duas chamadas simultâneas que tomam 401 ao mesmo tempo não devem disparar
  // duas renovações concorrentes (a segunda chegaria com o refreshToken já
  // rotacionado pela primeira e falharia à toa) — compartilha a mesma promise.
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      try {
        const renovado = await api.post<RenovarTokenResponse>('/auth/clientes/refresh', {
          refreshToken: sessaoAtual.refreshToken,
        });
        salvarSessaoCliente({ ...sessaoAtual, ...renovado });
        return true;
      } catch {
        return false;
      } finally {
        renovacaoEmAndamento = null;
      }
    })();
  }
  return renovacaoEmAndamento;
}

async function comAuth<T>(chamada: () => Promise<T>): Promise<T> {
  try {
    return await chamada();
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) {
      const renovou = await tentarRenovar();
      if (renovou) {
        try {
          return await chamada();
        } catch (erroAposRenovar) {
          if (erroAposRenovar instanceof ApiError && erroAposRenovar.status === 401) {
            limparSessaoCliente();
          }
          throw erroAposRenovar;
        }
      }
      limparSessaoCliente();
    }
    throw erro;
  }
}

export const contaApi = {
  get: <T>(caminho: string) => comAuth(() => api.get<T>(caminho, { headers: authHeader() })),
  post: <T>(caminho: string, body?: unknown) =>
    comAuth(() => api.post<T>(caminho, body, { headers: authHeader() })),
  put: <T>(caminho: string, body?: unknown) =>
    comAuth(() => api.put<T>(caminho, body, { headers: authHeader() })),
  patch: <T>(caminho: string, body?: unknown) =>
    comAuth(() => api.patch<T>(caminho, body, { headers: authHeader() })),
  delete: <T>(caminho: string) => comAuth(() => api.delete<T>(caminho, { headers: authHeader() })),
};
