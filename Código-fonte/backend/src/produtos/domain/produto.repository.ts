import { Produto } from './produto.entity';

export interface FiltrosListagemProdutos {
  pagina: number;
  limite: number;
  busca?: string;
  categoria?: string;
  ativo?: boolean;
  ordenarPor?: 'nome' | 'preco' | 'createdAt';
  direcao?: 'asc' | 'desc';
}

export interface ResultadoPaginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  limite: number;
}

export interface DadosCriacaoProduto {
  nome: string;
  slug: string;
  preco: number;
  estoque: number;
  descricao?: string;
  categoria?: string;
}

export interface DadosAtualizacaoProduto {
  nome?: string;
  slug?: string;
  preco?: number;
  estoque?: number;
  descricao?: string;
  categoria?: string;
  ativo?: boolean;
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
