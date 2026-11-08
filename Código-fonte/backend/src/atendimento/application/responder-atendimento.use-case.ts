import { Injectable, Logger } from '@nestjs/common';
import type Anthropic from '@anthropic-ai/sdk';
import { EventoAtendimento } from '../domain/evento-atendimento';
import { MensagemModelo, ModeloAtendimento } from '../domain/modelo-atendimento';
import { ContextoFerramenta, FerramentasAtendimento } from './ferramentas-atendimento';
import { LimiteDiarioAtendimento } from './limite-diario-atendimento';

const MAXIMO_MENSAGENS_HISTORICO = 12;
const MAXIMO_TURNOS_POR_RESPOSTA = 5;

export const MENSAGEM_SEM_RESPOSTA =
  'Não consegui responder isso por aqui. Nossa equipe pode ajudar pelo WhatsApp.';
export const MENSAGEM_LIMITE_DIARIO =
  'O atendimento automático está com muita procura hoje. Nossa equipe atende você pelo WhatsApp.';
const MENSAGEM_WHATSAPP_PADRAO = 'Olá! Vim pelo chat do site e preciso de ajuda.';

export interface MensagemConversa {
  papel: 'cliente' | 'assistente';
  texto: string;
}

export interface EntradaAtendimento {
  mensagens: MensagemConversa[];
  clienteId?: string;
}

/** O histórico chega do navegador só com os textos: as conversas não ficam guardadas no servidor.
 * Forjar uma fala do assistente só afeta a própria conversa de quem forjou, porque as ferramentas
 * dependem do JWT e não do histórico. */
function montarConversa(mensagens: MensagemConversa[]): MensagemModelo[] {
  const recentes = mensagens.slice(-MAXIMO_MENSAGENS_HISTORICO);
  const inicio = recentes.findIndex((mensagem) => mensagem.papel === 'cliente');
  return recentes.slice(Math.max(inicio, 0)).map((mensagem) => ({
    role: mensagem.papel === 'cliente' ? 'user' : 'assistant',
    content: mensagem.texto,
  }));
}

/** Se o modelo de reserva assumiu no meio do turno, o que veio antes da troca não pode ser
 * reenviado, exceto texto. Sem troca, o conteúdo volta inalterado. */
function conteudoParaReenviar(
  conteudo: Anthropic.Beta.BetaContentBlock[],
): Anthropic.Beta.BetaContentBlockParam[] {
  const troca = conteudo.map((bloco) => bloco.type as string).lastIndexOf('fallback');
  const naoReenviar = new Set(['thinking', 'redacted_thinking', 'tool_use']);
  return conteudo.filter(
    (bloco, indice) => indice > troca || !naoReenviar.has(bloco.type),
  ) as Anthropic.Beta.BetaContentBlockParam[];
}

@Injectable()
export class ResponderAtendimentoUseCase {
  private readonly logger = new Logger(ResponderAtendimentoUseCase.name);

  constructor(
    private readonly modelo: ModeloAtendimento,
    private readonly ferramentas: FerramentasAtendimento,
    private readonly limiteDiario: LimiteDiarioAtendimento,
  ) {}

  async executar(
    { mensagens, clienteId }: EntradaAtendimento,
    emitir: (evento: EventoAtendimento) => void,
    sinal: AbortSignal,
  ): Promise<void> {
    if (!this.limiteDiario.consumir()) {
      this.responderComWhatsapp(MENSAGEM_LIMITE_DIARIO, emitir);
      return;
    }

    const conversa = montarConversa(mensagens);
    let respondeu = false;
    let separarDoTextoAnterior = false;
    const aoReceberTexto = (texto: string) => {
      // Texto de turnos diferentes chega colado: sem isso, a frase antes da busca emenda na de depois.
      if (separarDoTextoAnterior) emitir({ tipo: 'texto', texto: '\n\n' });
      separarDoTextoAnterior = false;
      respondeu = true;
      emitir({ tipo: 'texto', texto });
    };
    const emitirDeFerramenta = (evento: EventoAtendimento) => {
      respondeu = true;
      emitir(evento);
    };

    for (let turno = 0; turno < MAXIMO_TURNOS_POR_RESPOSTA; turno++) {
      const resposta = await this.modelo.gerarTurno(conversa, aoReceberTexto, sinal);
      this.logger.log({
        mensagem: 'turno do atendimento',
        modelo: resposta.model,
        parada: resposta.stop_reason,
        entrada: resposta.usage.input_tokens,
        cacheLido: resposta.usage.cache_read_input_tokens,
        cacheEscrito: resposta.usage.cache_creation_input_tokens,
        saida: resposta.usage.output_tokens,
      });

      // Em qualquer outra parada (fim, recusa, limite de tokens) as ferramentas não rodam:
      // recusa e limite podem deixar a chamada de ferramenta pela metade.
      const chamadas = resposta.content.filter(
        (bloco): bloco is Anthropic.Beta.BetaToolUseBlock => bloco.type === 'tool_use',
      );
      if (resposta.stop_reason !== 'tool_use' || chamadas.length === 0) {
        if (!respondeu) this.responderComWhatsapp(MENSAGEM_SEM_RESPOSTA, emitir);
        return;
      }

      separarDoTextoAnterior = respondeu;
      const resultados = await Promise.all(
        chamadas.map((chamada) =>
          this.executarFerramenta(chamada, { clienteId, emitir: emitirDeFerramenta }),
        ),
      );
      conversa.push({ role: 'assistant', content: conteudoParaReenviar(resposta.content) });
      conversa.push({ role: 'user', content: resultados });
    }

    // Esgotou os turnos sem encerrar: melhor passar pra equipe do que seguir gastando.
    this.responderComWhatsapp(MENSAGEM_SEM_RESPOSTA, emitir);
  }

  private async executarFerramenta(
    chamada: Anthropic.Beta.BetaToolUseBlock,
    contexto: ContextoFerramenta,
  ): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
    try {
      const content = await this.ferramentas.executar(chamada.name, chamada.input, contexto);
      return { type: 'tool_result', tool_use_id: chamada.id, content };
    } catch (erro) {
      this.logger.error({
        mensagem: 'falha em ferramenta do atendimento',
        ferramenta: chamada.name,
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      return {
        type: 'tool_result',
        tool_use_id: chamada.id,
        is_error: true,
        content: 'Não foi possível consultar agora. Ofereça o WhatsApp da loja.',
      };
    }
  }

  private responderComWhatsapp(texto: string, emitir: (evento: EventoAtendimento) => void): void {
    emitir({ tipo: 'texto', texto });
    emitir({ tipo: 'whatsapp', mensagem: MENSAGEM_WHATSAPP_PADRAO });
  }
}
