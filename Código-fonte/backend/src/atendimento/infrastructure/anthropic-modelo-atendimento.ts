import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { DEFINICOES_FERRAMENTAS } from '../application/ferramentas-atendimento';
import { INSTRUCOES_ATENDIMENTO } from '../application/instrucoes-atendimento';
import { MensagemModelo, ModeloAtendimento, TurnoModelo } from '../domain/modelo-atendimento';

const MODELO_PADRAO = 'claude-haiku-5-5';
// Limita o gasto por turno. Conta raciocínio + resposta; a resposta de um chat é curta.
const MAXIMO_TOKENS_POR_TURNO = 2048;
const TEMPO_LIMITE_MS = 60_000;

@Injectable()
export class AnthropicModeloAtendimento extends ModeloAtendimento {
  private readonly cliente: Anthropic | null;
  private readonly modelo: string;

  constructor(configService: ConfigService) {
    super();
    const apiKey = configService.get<string>('ANTHROPIC_API_KEY');
    this.cliente = apiKey ? new Anthropic({ apiKey, timeout: TEMPO_LIMITE_MS }) : null;
    this.modelo = configService.get<string>('ATENDIMENTO_MODELO') || MODELO_PADRAO;
  }

  estaDisponivel(): boolean {
    return this.cliente !== null;
  }

  gerarTurno(
    mensagens: MensagemModelo[],
    aoReceberTexto: (texto: string) => void,
    sinal: AbortSignal,
  ): Promise<TurnoModelo> {
    if (!this.cliente) throw new Error('ANTHROPIC_API_KEY não configurada.');
    const stream = this.cliente.beta.messages.stream(
      {
        model: this.modelo,
        max_tokens: MAXIMO_TOKENS_POR_TURNO,
        // Se o modelo recusar por engano (classificadores de segurança), outro assume na mesma
        // chamada. Em modelo sem esse recurso, o parâmetro é simplesmente ignorado.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        cache_control: { type: 'ephemeral' },
        system: INSTRUCOES_ATENDIMENTO,
        tools: DEFINICOES_FERRAMENTAS,
        messages: mensagens,
      },
      { signal: sinal },
    );
    stream.on('text', aoReceberTexto);
    return stream.finalMessage();
  }
}
