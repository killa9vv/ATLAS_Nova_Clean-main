import { ConfigService } from '@nestjs/config';
import { Produto } from '../../produtos/domain/produto.entity';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { EventoAtendimento } from '../domain/evento-atendimento';
import { MensagemModelo, ModeloAtendimento, TurnoModelo } from '../domain/modelo-atendimento';
import { FerramentasAtendimento } from './ferramentas-atendimento';
import { LimiteDiarioAtendimento } from './limite-diario-atendimento';
import {
  MENSAGEM_LIMITE_DIARIO,
  MENSAGEM_SEM_RESPOSTA,
  ResponderAtendimentoUseCase,
} from './responder-atendimento.use-case';

function turno(
  conteudo: unknown[],
  paradaEm: string = conteudo.some((b) => (b as { type: string }).type === 'tool_use')
    ? 'tool_use'
    : 'end_turn',
): TurnoModelo {
  return {
    content: conteudo,
    stop_reason: paradaEm,
    model: 'modelo-falso',
    usage: { input_tokens: 1, output_tokens: 1 },
  } as unknown as TurnoModelo;
}

const texto = (t: string) => ({ type: 'text', text: t });
const chamada = (name: string, input: unknown, id = 'chamada-1') => ({
  type: 'tool_use',
  id,
  name,
  input,
});

function produto(id: string, ativo = true, estoque = 5): Produto {
  return new Produto(id, `Produto ${id}`, `produto-${id}`, 10, estoque, ativo);
}

describe('ResponderAtendimentoUseCase', () => {
  let turnos: TurnoModelo[];
  let conversasRecebidas: MensagemModelo[][];
  let produtoRepository: jest.Mocked<Pick<ProdutoRepository, 'listarComFiltros' | 'buscarPorIds'>>;
  let pedidoRepository: jest.Mocked<Pick<PedidoRepository, 'listarPorCliente'>>;
  let limite: string | undefined;

  function montar() {
    const modelo: ModeloAtendimento = {
      estaDisponivel: () => true,
      gerarTurno: async (mensagens, aoReceberTexto) => {
        conversasRecebidas.push(structuredClone(mensagens));
        const proximo = turnos.shift();
        if (!proximo) throw new Error('O modelo foi chamado mais vezes que o esperado.');
        for (const bloco of proximo.content) {
          if (bloco.type === 'text') aoReceberTexto(bloco.text);
        }
        return proximo;
      },
    };
    return new ResponderAtendimentoUseCase(
      modelo,
      new FerramentasAtendimento(
        produtoRepository as unknown as ProdutoRepository,
        pedidoRepository as unknown as PedidoRepository,
      ),
      new LimiteDiarioAtendimento({ get: () => limite } as unknown as ConfigService),
    );
  }

  async function conversar(clienteId?: string, mensagem = 'oi') {
    const eventos: EventoAtendimento[] = [];
    await montar().executar(
      { mensagens: [{ papel: 'cliente', texto: mensagem }], clienteId },
      (evento) => eventos.push(evento),
      new AbortController().signal,
    );
    return eventos;
  }

  beforeEach(() => {
    turnos = [];
    conversasRecebidas = [];
    limite = undefined;
    produtoRepository = {
      listarComFiltros: jest.fn().mockResolvedValue({ itens: [], total: 0, pagina: 1, limite: 15 }),
      buscarPorIds: jest.fn().mockResolvedValue([]),
    };
    pedidoRepository = {
      listarPorCliente: jest.fn().mockResolvedValue({ itens: [], total: 0, pagina: 1, limite: 5 }),
    };
  });

  it('devolve o resultado da ferramenta ao modelo e transmite só o texto', async () => {
    produtoRepository.listarComFiltros.mockResolvedValue({
      itens: [produto('a')],
      total: 1,
      pagina: 1,
      limite: 15,
    });
    turnos = [
      turno([chamada('buscar_produtos', { termo: 'detergente' })]),
      turno([texto('Temos sim!')]),
    ];

    const eventos = await conversar();

    expect(eventos).toEqual([{ tipo: 'texto', texto: 'Temos sim!' }]);
    expect(produtoRepository.listarComFiltros).toHaveBeenCalledWith(
      expect.objectContaining({ busca: 'detergente', ativo: true }),
    );
    const resultado = conversasRecebidas[1][2].content as {
      tool_use_id: string;
      content: string;
    }[];
    expect(resultado[0].tool_use_id).toBe('chamada-1');
    expect(JSON.parse(resultado[0].content).produtos[0].id).toBe('a');
  });

  it('reenvia o raciocínio do turno sem alterar, junto da chamada de ferramenta', async () => {
    const raciocinio = { type: 'thinking', thinking: '', signature: 'assinatura' };
    turnos = [
      turno([raciocinio, chamada('buscar_produtos', { termo: 'sabão' })]),
      turno([texto('Pronto')]),
    ];

    await conversar();

    expect(conversasRecebidas[1][1]).toEqual({
      role: 'assistant',
      content: [raciocinio, chamada('buscar_produtos', { termo: 'sabão' })],
    });
  });

  it('separa o texto de turnos diferentes', async () => {
    turnos = [
      turno([texto('Vou procurar.'), chamada('buscar_produtos', { termo: 'sabão' })]),
      turno([texto('Achei.')]),
    ];

    const eventos = await conversar();

    expect(eventos.map((e) => (e.tipo === 'texto' ? e.texto : e.tipo)).join('')).toBe(
      'Vou procurar.\n\nAchei.',
    );
  });

  it('mostra só produtos ativos e existentes, na ordem escolhida e até 4', async () => {
    produtoRepository.buscarPorIds.mockResolvedValue([
      produto('b'),
      produto('a'),
      produto('inativo', false),
      produto('c'),
      produto('d'),
      produto('e'),
    ]);
    turnos = [
      turno([
        chamada('mostrar_produtos', { ids: ['a', 'inativo', 'inventado', 'b', 'c', 'd', 'e'] }),
      ]),
      turno([texto('Olha só')]),
    ];

    const eventos = await conversar();

    expect(produtoRepository.buscarPorIds).toHaveBeenCalledWith(['a', 'inativo', 'inventado', 'b']);
    const cartoes = eventos.find((e) => e.tipo === 'produtos');
    expect(cartoes).toMatchObject({ itens: [{ id: 'a' }, { id: 'b' }] });
  });

  it('não consulta pedidos de quem não está logado', async () => {
    turnos = [turno([chamada('consultar_meus_pedidos', {})]), turno([texto('Entre na conta')])];

    await conversar();

    expect(pedidoRepository.listarPorCliente).not.toHaveBeenCalled();
    const resultado = conversasRecebidas[1][2].content as { content: string }[];
    expect(JSON.parse(resultado[0].content)).toEqual({ logado: false });
  });

  it('consulta os pedidos só do cliente autenticado, mesmo que o modelo mande outro id', async () => {
    turnos = [
      turno([chamada('consultar_meus_pedidos', { clienteId: 'outra-pessoa' })]),
      turno([texto('Seus pedidos')]),
    ];

    await conversar('cliente-do-jwt');

    expect(pedidoRepository.listarPorCliente).toHaveBeenCalledTimes(1);
    expect(pedidoRepository.listarPorCliente.mock.calls[0][0]).toBe('cliente-do-jwt');
  });

  it('emite o encaminhamento pro WhatsApp com a mensagem escrita pelo modelo', async () => {
    turnos = [
      turno([chamada('encaminhar_whatsapp', { mensagem: 'Quero trocar um produto.' })]),
      turno([texto('É só tocar no botão.')]),
    ];

    const eventos = await conversar();

    expect(eventos).toContainEqual({ tipo: 'whatsapp', mensagem: 'Quero trocar um produto.' });
  });

  it('avisa o modelo quando a ferramenta falha, sem derrubar a conversa', async () => {
    produtoRepository.listarComFiltros.mockRejectedValue(new Error('banco fora'));
    turnos = [
      turno([chamada('buscar_produtos', { termo: 'sabão' })]),
      turno([texto('Não consegui ver agora.')]),
    ];

    const eventos = await conversar();

    const resultado = conversasRecebidas[1][2].content as { is_error: boolean }[];
    expect(resultado[0].is_error).toBe(true);
    expect(eventos).toEqual([{ tipo: 'texto', texto: 'Não consegui ver agora.' }]);
  });

  it.each(['refusal', 'max_tokens'])(
    'não executa ferramenta quando a parada é %s e oferece o WhatsApp se nada foi dito',
    async (parada) => {
      turnos = [turno([chamada('buscar_produtos', { termo: 'sabão' })], parada)];

      const eventos = await conversar();

      expect(produtoRepository.listarComFiltros).not.toHaveBeenCalled();
      expect(eventos[0]).toEqual({ tipo: 'texto', texto: MENSAGEM_SEM_RESPOSTA });
      expect(eventos[1]).toMatchObject({ tipo: 'whatsapp' });
    },
  );

  it('para de chamar o modelo depois de 5 turnos e passa pra equipe', async () => {
    turnos = Array.from({ length: 5 }, () =>
      turno([chamada('buscar_produtos', { termo: 'sabão' })]),
    );

    const eventos = await conversar();

    expect(conversasRecebidas).toHaveLength(5);
    expect(eventos[0]).toEqual({ tipo: 'texto', texto: MENSAGEM_SEM_RESPOSTA });
  });

  it('não chama o modelo depois do limite do dia', async () => {
    limite = '1';
    const useCase = montar();
    turnos = [turno([texto('Olá')])];
    const responder = async () => {
      const eventos: EventoAtendimento[] = [];
      await useCase.executar(
        { mensagens: [{ papel: 'cliente', texto: 'oi' }] },
        (evento) => eventos.push(evento),
        new AbortController().signal,
      );
      return eventos;
    };

    await responder();
    const segunda = await responder();

    expect(conversasRecebidas).toHaveLength(1);
    expect(segunda[0]).toEqual({ tipo: 'texto', texto: MENSAGEM_LIMITE_DIARIO });
    expect(segunda[1]).toMatchObject({ tipo: 'whatsapp' });
  });

  it('manda só o histórico recente, começando por uma fala do cliente', async () => {
    const mensagens = Array.from({ length: 20 }, (_, i) => ({
      papel: (i % 2 === 0 ? 'cliente' : 'assistente') as 'cliente' | 'assistente',
      texto: `m${i}`,
    }));
    mensagens.push({ papel: 'cliente', texto: 'última' });
    mensagens.splice(9, 1);
    turnos = [turno([texto('ok')])];

    await montar().executar({ mensagens }, () => undefined, new AbortController().signal);

    const enviada = conversasRecebidas[0];
    expect(enviada.length).toBeLessThanOrEqual(12);
    expect(enviada[0].role).toBe('user');
    expect(enviada[enviada.length - 1]).toEqual({ role: 'user', content: 'última' });
  });
});

describe('LimiteDiarioAtendimento', () => {
  it('zera a contagem na virada do dia no horário de Brasília', () => {
    const limite = new LimiteDiarioAtendimento({ get: () => '1' } as unknown as ConfigService);

    expect(limite.consumir(new Date('2026-11-08T12:00:00Z'))).toBe(true);
    // 02:59 UTC do dia 9 ainda é 23:59 do dia 8 em Brasília.
    expect(limite.consumir(new Date('2026-11-09T02:59:00Z'))).toBe(false);
    expect(limite.consumir(new Date('2026-11-09T03:01:00Z'))).toBe(true);
  });
});
