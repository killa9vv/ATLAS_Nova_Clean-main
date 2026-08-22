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
}
