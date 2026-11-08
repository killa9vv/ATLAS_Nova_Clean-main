import { API_BASE_URL, ApiError, api } from '@/lib/http';
import { obterTokenClienteValido } from '@/lib/conta-api';

export interface ProdutoDoChat {
  id: string;
  nome: string;
  marca?: string;
  pack?: string;
  preco: number;
  precoPromocional?: number;
  disponivel: boolean;
  href?: string;
}

export type EventoAtendimento =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'produtos'; itens: ProdutoDoChat[] }
  | { tipo: 'whatsapp'; mensagem: string }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'fim' };

export interface MensagemParaAtendimento {
  papel: 'cliente' | 'assistente';
  texto: string;
}

export function buscarStatusAtendimento(): Promise<{ ativo: boolean }> {
  return api.get('/atendimento/status');
}

/** A resposta vem em Server-Sent Events, mas por POST: o EventSource do navegador só faz GET,
 * então o stream é lido à mão. Resolve quando o stream termina. */
export async function conversarComAtendimento(
  mensagens: MensagemParaAtendimento[],
  aoReceberEvento: (evento: EventoAtendimento) => void,
  sinal: AbortSignal,
): Promise<void> {
  const token = await obterTokenClienteValido();
  const resposta = await fetch(`${API_BASE_URL}/atendimento/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mensagens }),
    signal: sinal,
  });
  if (!resposta.ok || !resposta.body) {
    throw new ApiError('Não foi possível falar com o atendimento.', resposta.status, null);
  }

  const leitor = resposta.body.pipeThrough(new TextDecoderStream()).getReader();
  let acumulado = '';
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) return;
    acumulado += value;
    const blocos = acumulado.split('\n\n');
    // O último pedaço pode ser um evento ainda incompleto: fica pra próxima leitura.
    acumulado = blocos.pop() ?? '';
    for (const bloco of blocos) {
      if (bloco.startsWith('data: ')) aoReceberEvento(JSON.parse(bloco.slice(6)));
    }
  }
}
