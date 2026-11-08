import { Produto } from './produto.entity';

export interface FiltrosListagemProdutos {
  pagina: number;
  limite: number;
  busca?: string;
  categoria?: string;
  marcaId?: string;
  produtoTipoSlug?: string;
  /** OR entre si — independente de `categoria` (singular). */
  categorias?: string[];
  /** OR entre si — independente de `marcaId` (singular). */
  marcaIds?: string[];
  precoMin?: number;
  precoMax?: number;
  /** true = só produtos com estoque > 0. */
  disponivel?: boolean;
  ativo?: boolean;
  /** true = só produtos com preço promocional cadastrado (ver Produto.estaEmPromocao). */
  emPromocao?: boolean;
  /** true = produtos com foto antes dos sem foto, mantendo ordenarPor/direcao em cada grupo. */
  fotoPrimeiro?: boolean;
  ordenarPor?: 'nome' | 'preco' | 'createdAt';
  direcao?: 'asc' | 'desc';
}

export interface ResultadoPaginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  limite: number;
  /**
   * Menor/maior preço entre os produtos que batem com os filtros ATUAIS exceto
   * precoMin/precoMax (senão o próprio filtro de preço estreitaria os limites do
   * slider a cada uso). undefined quando não há nenhum produto no escopo.
   */
  precoMinCatalogo?: number;
  precoMaxCatalogo?: number;
}

export interface DadosCriacaoProduto {
  nome: string;
  slug: string;
  preco: number;
  estoque: number;
  descricao?: string;
  categoria?: string;
  pesoKg?: number;
  alturaCm?: number;
  larguraCm?: number;
  comprimentoCm?: number;
  precoPromocional?: number | null;
}

export interface DadosAtualizacaoProduto {
  nome?: string;
  slug?: string;
  preco?: number;
  estoque?: number;
  descricao?: string;
  categoria?: string;
  ativo?: boolean;
  pesoKg?: number;
  alturaCm?: number;
  larguraCm?: number;
  comprimentoCm?: number;
  /** undefined = não mexe no campo; null = remove a promoção (volta pro preço normal). */
  precoPromocional?: number | null;
}

export interface ItemParaDecrementarEstoque {
  produtoId: string;
  nome: string;
  quantidade: number;
}

export interface ItemParaAjustarEstoque {
  produtoId: string;
  quantidade: number;
}

/**
 * Porta do repositório de produtos. A camada de domínio/aplicação depende
 * apenas desta abstração — quem implementa é a infraestrutura (Prisma).
 */
export abstract class ProdutoRepository {
  abstract listarTodos(): Promise<Produto[]>;
  abstract listarComFiltros(filtros: FiltrosListagemProdutos): Promise<ResultadoPaginado<Produto>>;
  /**
   * Produtos ativos ordenados por quantidade total vendida (soma de ItemPedido.quantidade
   * em pedidos PAGO/SEPARACAO/ENVIADO/ENTREGUE — CRIADO/AGUARDANDO_CONTATO/AGUARDANDO_PAGAMENTO
   * e CANCELADO/ESTORNADO não contam como venda: o primeiro grupo nunca chegou a ser pago,
   * o segundo foi revertido). Produtos sem nenhuma venda nesse critério não entram na lista.
   */
  abstract listarMaisVendidos(limite: number): Promise<Produto[]>;
  abstract buscarPorId(id: string): Promise<Produto | null>;
  abstract buscarPorIds(ids: string[]): Promise<Produto[]>;
  abstract buscarPorSlug(slug: string): Promise<Produto | null>;
  abstract criar(dados: DadosCriacaoProduto): Promise<Produto>;
  abstract atualizar(id: string, dados: DadosAtualizacaoProduto): Promise<Produto>;

  /**
   * Decrementa o estoque de cada item de forma atômica (tudo ou nada): se algum
   * item não tiver estoque suficiente no momento da escrita, nenhum é decrementado.
   * Existe para fechar a janela de corrida entre a validação de estoque (leitura)
   * e a criação do pedido — duas compras concorrentes não podem vender o mesmo
   * último item.
   *
   * `contexto`, quando informado, é o contexto de transação devolvido por
   * `TransactionManager.executar` — usado para que este decremento e a criação do
   * pedido correspondente aconteçam na mesma transação atômica. Sem ele, o método
   * abre sua própria transação interna (uso avulso, ex.: testes).
   */
  abstract decrementarEstoque(
    itens: ItemParaDecrementarEstoque[],
    contexto?: unknown,
  ): Promise<void>;

  /**
   * Devolve estoque (ex.: pedido cancelado/estornado depois de ter sido decrementado
   * na criação). Sempre soma — não há checagem de limite superior.
   */
  abstract incrementarEstoque(itens: ItemParaAjustarEstoque[], contexto?: unknown): Promise<void>;
}
