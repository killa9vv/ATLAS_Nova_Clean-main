import { Injectable } from '@nestjs/common';
import type Anthropic from '@anthropic-ai/sdk';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { Pedido } from '../../pedidos/domain/pedido.entity';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { Produto } from '../../produtos/domain/produto.entity';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { EventoAtendimento, ProdutoExibido } from '../domain/evento-atendimento';

const LIMITE_BUSCA = 30;
const LIMITE_EXIBIDOS = 4;
const LIMITE_PEDIDOS = 5;
const TAMANHO_MAXIMO_MENSAGEM_WHATSAPP = 600;

const STATUS_PARA_CLIENTE: Record<StatusPedido, string> = {
  [StatusPedido.CRIADO]: 'Aguardando pagamento',
  [StatusPedido.AGUARDANDO_PAGAMENTO]: 'Aguardando pagamento',
  [StatusPedido.AGUARDANDO_CONTATO]: 'Aguardando a loja fechar pelo WhatsApp',
  [StatusPedido.PAGO]: 'Pagamento confirmado',
  [StatusPedido.SEPARACAO]: 'Em separação',
  [StatusPedido.ENVIADO]: 'Saiu para entrega',
  [StatusPedido.ENTREGUE]: 'Entregue',
  [StatusPedido.CANCELADO]: 'Cancelado',
  [StatusPedido.ESTORNADO]: 'Pagamento estornado',
};

// `strict` garante que a entrada bate com o esquema, mas o esquema estrito não aceita
// limites de tamanho: esses ficam no código, ao executar.
export const DEFINICOES_FERRAMENTAS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'buscar_produtos',
    description:
      'Busca produtos ativos no catálogo da loja por texto no nome ou na descrição. Retorna id, nome, marca, embalagem (com aroma ou variação, quando houver), preços e se está disponível, além do total encontrado. Se o total for maior que a lista, nem todos vieram: não afirme qual é o mais barato sem dizer isso.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        termo: {
          type: 'string',
          description: 'Tipo de produto em uma ou duas palavras, sem a marca. Ex.: "detergente".',
        },
      },
      required: ['termo'],
      additionalProperties: false,
    },
  },
  {
    name: 'mostrar_produtos',
    description: `Mostra ao cliente cartões com foto, preço e botão de adicionar ao carrinho. Use os ids retornados por buscar_produtos, até ${LIMITE_EXIBIDOS}, com os mais indicados primeiro.`,
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['ids'],
      additionalProperties: false,
    },
  },
  {
    name: 'consultar_meus_pedidos',
    description:
      'Lista os pedidos mais recentes do cliente logado neste chat, com número, status, data, total e código de rastreio. Só enxerga os pedidos de quem está conversando.',
    strict: true,
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
  },
  {
    name: 'encaminhar_whatsapp',
    description:
      'Mostra ao cliente um botão que abre o WhatsApp da loja com uma mensagem já escrita.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        mensagem: {
          type: 'string',
          description:
            'Mensagem em primeira pessoa, como se o cliente escrevesse à loja, resumindo em até 3 frases o que ele precisa, com produtos e número do pedido quando houver.',
        },
      },
      required: ['mensagem'],
      additionalProperties: false,
    },
  },
];

export interface ContextoFerramenta {
  /** Sempre do JWT, nunca do modelo: é o que impede ver pedido de outra pessoa. */
  clienteId?: string;
  emitir: (evento: EventoAtendimento) => void;
}

@Injectable()
export class FerramentasAtendimento {
  constructor(
    private readonly produtoRepository: ProdutoRepository,
    private readonly pedidoRepository: PedidoRepository,
  ) {}

  /** Devolve o texto do tool_result. Uma exceção aqui vira tool_result de erro em quem chama. */
  async executar(nome: string, entrada: unknown, contexto: ContextoFerramenta): Promise<string> {
    const dados = (entrada ?? {}) as Record<string, unknown>;
    switch (nome) {
      case 'buscar_produtos':
        return this.buscarProdutos(String(dados.termo ?? ''));
      case 'mostrar_produtos':
        return this.mostrarProdutos(dados.ids, contexto);
      case 'consultar_meus_pedidos':
        return this.consultarPedidos(contexto);
      case 'encaminhar_whatsapp':
        return this.encaminharWhatsapp(String(dados.mensagem ?? ''), contexto);
      default:
        throw new Error(`Ferramenta desconhecida: ${nome}`);
    }
  }

  private async buscarProdutos(termo: string): Promise<string> {
    const busca = termo.trim();
    if (!busca) return JSON.stringify({ erro: 'Informe um termo de busca.' });
    const { itens, total } = await this.produtoRepository.listarComFiltros({
      pagina: 1,
      limite: LIMITE_BUSCA,
      busca,
      ativo: true,
      fotoPrimeiro: true,
      ordenarPor: 'nome',
      direcao: 'asc',
    });
    return JSON.stringify({
      total,
      produtos: itens.map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        marca: produto.marca?.nome,
        embalagem: produto.pack,
        preco: produto.preco,
        preco_promocional: produto.precoPromocional,
        disponivel: produto.possuiEstoqueDisponivel(1),
      })),
    });
  }

  private async mostrarProdutos(ids: unknown, contexto: ContextoFerramenta): Promise<string> {
    const escolhidos = Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === 'string').slice(0, LIMITE_EXIBIDOS)
      : [];
    const encontrados = await this.produtoRepository.buscarPorIds(escolhidos);
    // Na ordem que o modelo escolheu, sem produto inativo nem id inventado.
    const itens = escolhidos
      .map((id) => encontrados.find((produto) => produto.id === id && produto.ativo))
      .filter((produto): produto is Produto => !!produto)
      .map(paraProdutoExibido);
    if (itens.length === 0) {
      return JSON.stringify({ erro: 'Nenhum dos ids é de um produto ativo. Busque de novo.' });
    }
    contexto.emitir({ tipo: 'produtos', itens });
    return JSON.stringify({ exibidos: itens.map((item) => item.nome) });
  }

  private async consultarPedidos({ clienteId }: ContextoFerramenta): Promise<string> {
    if (!clienteId) return JSON.stringify({ logado: false });
    const { itens } = await this.pedidoRepository.listarPorCliente(clienteId, {
      pagina: 1,
      limite: LIMITE_PEDIDOS,
    });
    return JSON.stringify({ logado: true, pedidos: itens.map(paraPedidoResumido) });
  }

  private encaminharWhatsapp(mensagem: string, contexto: ContextoFerramenta): string {
    const texto = mensagem.trim().slice(0, TAMANHO_MAXIMO_MENSAGEM_WHATSAPP);
    if (!texto) return JSON.stringify({ erro: 'Escreva a mensagem.' });
    contexto.emitir({ tipo: 'whatsapp', mensagem: texto });
    return JSON.stringify({ botao_exibido: true });
  }
}

function paraProdutoExibido(produto: Produto): ProdutoExibido {
  return {
    id: produto.id,
    nome: produto.nome,
    marca: produto.marca?.nome,
    pack: produto.pack,
    preco: produto.preco,
    precoPromocional: produto.precoPromocional,
    disponivel: produto.possuiEstoqueDisponivel(1),
    href: produto.produtoTipo ? `/produtos/${produto.produtoTipo.slug}` : undefined,
  };
}

function paraPedidoResumido(pedido: Pedido) {
  return {
    numero: pedido.numero,
    status: STATUS_PARA_CLIENTE[pedido.status],
    data: pedido.createdAt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    total: pedido.total,
    entrega: pedido.tipoEntrega === 'RETIRADA' ? 'Retirada na loja' : 'Entrega',
    codigo_rastreio: pedido.codigoRastreio,
    itens: pedido.itens.map((item) => `${item.quantidade}x ${item.nome}`),
  };
}
