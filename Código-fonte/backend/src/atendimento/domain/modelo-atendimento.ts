import type Anthropic from '@anthropic-ai/sdk';

export type MensagemModelo = Anthropic.Beta.BetaMessageParam;
export type TurnoModelo = Anthropic.Beta.BetaMessage;

/** Porta pro modelo de linguagem: a aplicação conduz a conversa e executa as ferramentas,
 * quem implementa só gera um turno. Mesmo padrão opcional das outras integrações: sem
 * credencial, a API sobe normalmente e o chat fica indisponível (`estaDisponivel`). */
export abstract class ModeloAtendimento {
  abstract estaDisponivel(): boolean;
  abstract gerarTurno(
    mensagens: MensagemModelo[],
    aoReceberTexto: (texto: string) => void,
    sinal: AbortSignal,
  ): Promise<TurnoModelo>;
}
