import { ConfigService } from '@nestjs/config';
import { createServer, IncomingMessage, Server } from 'http';
import { AddressInfo } from 'net';
import { AnthropicModeloAtendimento } from './anthropic-modelo-atendimento';

const EVENTOS_SSE = [
  {
    type: 'message_start',
    message: {
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-haiku-5-5',
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 1 },
    },
  },
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Olá' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: ', tudo bem?' } },
  { type: 'content_block_stop', index: 0 },
  {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: 5 },
  },
  { type: 'message_stop' },
];

// Um servidor local no lugar da API: confere o que o SDK realmente põe no fio, sem chamar a
// Anthropic. Não prova que a API aceita a requisição, isso só um teste com chave de verdade.
describe('AnthropicModeloAtendimento', () => {
  let servidor: Server;
  let requisicao: { cabecalhos: IncomingMessage['headers']; corpo: Record<string, unknown> };
  const baseUrlOriginal = process.env.ANTHROPIC_BASE_URL;

  const criar = (valores: Record<string, string | undefined>) =>
    new AnthropicModeloAtendimento({ get: (chave: string) => valores[chave] } as ConfigService);

  beforeAll(async () => {
    servidor = createServer((req, res) => {
      let bruto = '';
      req.on('data', (parte) => (bruto += parte));
      req.on('end', () => {
        requisicao = { cabecalhos: req.headers, corpo: JSON.parse(bruto) };
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        for (const evento of EVENTOS_SSE) {
          res.write(`event: ${evento.type}\ndata: ${JSON.stringify(evento)}\n\n`);
        }
        res.end();
      });
    });
    await new Promise<void>((resolve) => servidor.listen(0, resolve));
    process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    process.env.ANTHROPIC_BASE_URL = baseUrlOriginal;
    await new Promise((resolve) => servidor.close(resolve));
  });

  it('fica indisponível sem chave', () => {
    expect(criar({}).estaDisponivel()).toBe(false);
    expect(criar({ ANTHROPIC_API_KEY: '' }).estaDisponivel()).toBe(false);
    expect(criar({ ANTHROPIC_API_KEY: 'chave' }).estaDisponivel()).toBe(true);
  });

  it('transmite o texto e devolve o turno completo', async () => {
    const textos: string[] = [];

    const turno = await criar({ ANTHROPIC_API_KEY: 'chave' }).gerarTurno(
      [{ role: 'user', content: 'oi' }],
      (texto) => textos.push(texto),
      new AbortController().signal,
    );

    expect(textos).toEqual(['Olá', ', tudo bem?']);
    expect(turno.stop_reason).toBe('end_turn');
    expect(turno.usage.output_tokens).toBe(5);
  });

  it('manda modelo, limites, cache, ferramentas estritas e a chave só no cabeçalho', async () => {
    await criar({ ANTHROPIC_API_KEY: 'chave-secreta' }).gerarTurno(
      [{ role: 'user', content: 'oi' }],
      () => undefined,
      new AbortController().signal,
    );

    expect(requisicao.cabecalhos.authorization).toBe('Bearer chave-secreta');
    expect(requisicao.cabecalhos['anthropic-beta']).toContain('server-side-fallback-2026-07-01');
    expect(requisicao.corpo).toMatchObject({
      model: 'claude-haiku-5-5',
      max_tokens: 2048,
      stream: true,
      fallbacks: 'default',
      output_config: { effort: 'low' },
      cache_control: { type: 'ephemeral' },
    });
    expect(requisicao.corpo).not.toHaveProperty('betas');
    expect(requisicao.corpo).not.toHaveProperty('thinking');
    const ferramentas = requisicao.corpo.tools as { name: string; strict: boolean }[];
    expect(ferramentas.map((f) => f.name)).toEqual([
      'buscar_produtos',
      'mostrar_produtos',
      'consultar_meus_pedidos',
      'encaminhar_whatsapp',
    ]);
    expect(ferramentas.every((f) => f.strict)).toBe(true);
    expect(JSON.stringify(requisicao.corpo)).not.toContain('chave-secreta');
  });

  it('usa o modelo configurado no ambiente', async () => {
    await criar({ ANTHROPIC_API_KEY: 'chave', ATENDIMENTO_MODELO: 'claude-opus-5-5' }).gerarTurno(
      [{ role: 'user', content: 'oi' }],
      () => undefined,
      new AbortController().signal,
    );

    expect(requisicao.corpo.model).toBe('claude-opus-5-5');
  });
});
