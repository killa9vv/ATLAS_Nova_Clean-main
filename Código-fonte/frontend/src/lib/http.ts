const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface OpcoesRequisicao extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * Cliente HTTP centralizado pra API do backend. Mesmo padrão de
 * atlas-nova-clean-loja/js/payment.js (chamarApi): erro de rede vira uma mensagem
 * amigável, resposta não-ok vira ApiError com a mensagem que o backend mandou
 * (DomainExceptionFilter sempre devolve `{ mensagem }`).
 */
export async function apiFetch<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { body, headers, ...resto } = opcoes;
  // FormData (upload de arquivo, ex: imagem de produto) vai direto, sem
  // JSON.stringify e sem Content-Type manual — o browser define o boundary do
  // multipart sozinho; declarar Content-Type na mão quebra o parsing no backend.
  const ehFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      ...resto,
      headers: ehFormData ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : ehFormData ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      'Não conseguimos falar com o servidor agora. Tente novamente em instantes.',
      0,
      null,
    );
  }

  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // "mensagem": DomainExceptionFilter (exceções de domínio, ex: EstoqueInsuficienteException).
    // "message": formato nativo do Nest (ex: UnauthorizedException do login, que não é uma
    // DomainException e por isso não passa pelo filtro acima).
    const corpoErro = corpo as { mensagem?: string; message?: string } | null;
    const mensagem =
      corpoErro?.mensagem ?? corpoErro?.message ?? 'Não foi possível concluir a operação.';
    throw new ApiError(mensagem, resposta.status, corpo);
  }

  return corpo as T;
}

export const api = {
  get: <T>(caminho: string, opcoes?: OpcoesRequisicao) =>
    apiFetch<T>(caminho, { ...opcoes, method: 'GET' }),
  post: <T>(caminho: string, body?: unknown, opcoes?: OpcoesRequisicao) =>
    apiFetch<T>(caminho, { ...opcoes, method: 'POST', body }),
  put: <T>(caminho: string, body?: unknown, opcoes?: OpcoesRequisicao) =>
    apiFetch<T>(caminho, { ...opcoes, method: 'PUT', body }),
  patch: <T>(caminho: string, body?: unknown, opcoes?: OpcoesRequisicao) =>
    apiFetch<T>(caminho, { ...opcoes, method: 'PATCH', body }),
  delete: <T>(caminho: string, opcoes?: OpcoesRequisicao) =>
    apiFetch<T>(caminho, { ...opcoes, method: 'DELETE' }),
};
