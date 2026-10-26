import { api } from '@/lib/http';

export interface MarcaDoProduto {
  id: string;
  nome: string;
  imagemUrl?: string;
}

/** Tipo genérico (ex: "Detergente para Louça") que agrupa as variantes de marca/pack
 * de um mesmo produto — usado pra decidir card simples vs "Ver opções" e pra montar
 * o link da página de detalhe (/produtos/[slug]). */
export interface ProdutoTipoDoProduto {
  slug: string;
  nome: string;
  /** Texto técnico/precauções padrão do tipo. Nem todo tipo tem esse conteúdo
   * cadastrado ainda — undefined quando não há. */
  infoTecnica?: string;
  precaucoes?: string;
}

export interface Produto {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  /** Presente só quando há promoção ativa (sempre menor que `preco`). */
  precoPromocional?: number;
  estoque: number;
  ativo: boolean;
  pack?: string;
  marca?: MarcaDoProduto;
  produtoTipo?: ProdutoTipoDoProduto;
  /** Thumbnail 300x300 da imagem de ordem 0, se houver — já vem na listagem pra
   * card não precisar de uma chamada GET /produtos/:id/imagens cada (ver
   * useImagemPrincipal, que continua existindo só pra onde não há um Produto
   * completo em mãos, ex.: CarrinhoItemImagem). */
  imagemPrincipalThumbnailUrl?: string;
}

export interface ProdutoPaginado {
  itens: Produto[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
  /** Menor/maior preço no recorte atual (ignorando precoMin/precoMax) — limites
   * reais pro slider de preço. undefined se não há nenhum produto no recorte. */
  precoMinCatalogo?: number;
  precoMaxCatalogo?: number;
}

export interface ImagemProduto {
  id: string;
  produtoId: string;
  url: string;
  thumbnailUrl: string;
  ordem: number;
  principal: boolean;
}

export interface FiltrosListarProdutos {
  pagina: number;
  limite: number;
  busca?: string;
  categoria?: string;
  /** Variantes (marca/embalagem) do mesmo tipo genérico — usado pela página de
   * detalhe de produto pra buscar só as ~poucas variantes, não o catálogo inteiro. */
  produtoTipoSlug?: string;
  /** Várias categorias, combinadas com OR entre si — independente de `categoria`. */
  categorias?: string[];
  /** Várias marcas, combinadas com OR entre si. */
  marcaIds?: string[];
  precoMin?: number;
  precoMax?: number;
  /** true = só estoque > 0. */
  disponivel?: boolean;
  emPromocao?: boolean;
  ordenarPor?: 'nome' | 'preco' | 'createdAt';
  direcao?: 'asc' | 'desc';
}

export interface OpcoesListarProdutos {
  /** Só faz sentido em chamada server-side (RSC) — ignorado pelo fetch do browser. */
  next?: { revalidate?: number };
  /** Cancela a requisição em voo — React Query injeta isso automaticamente via queryFn. */
  signal?: AbortSignal;
}

// Loja pública: sempre ativo=true, diferente do admin (que precisa ver inativos também).
export function listarProdutos(
  params: FiltrosListarProdutos,
  opcoes?: OpcoesListarProdutos,
): Promise<ProdutoPaginado> {
  const query = new URLSearchParams({
    pagina: String(params.pagina),
    limite: String(params.limite),
    ativo: 'true',
  });
  if (params.busca) query.set('busca', params.busca);
  if (params.categoria) query.set('categoria', params.categoria);
  if (params.produtoTipoSlug) query.set('produtoTipoSlug', params.produtoTipoSlug);
  for (const categoria of params.categorias ?? []) query.append('categorias', categoria);
  for (const marcaId of params.marcaIds ?? []) query.append('marcaIds', marcaId);
  if (params.precoMin !== undefined) query.set('precoMin', String(params.precoMin));
  if (params.precoMax !== undefined) query.set('precoMax', String(params.precoMax));
  if (params.disponivel) query.set('disponivel', 'true');
  if (params.emPromocao) query.set('emPromocao', 'true');
  if (params.ordenarPor) query.set('ordenarPor', params.ordenarPor);
  if (params.direcao) query.set('direcao', params.direcao);
  return api.get<ProdutoPaginado>(`/produtos?${query.toString()}`, opcoes);
}

// Sem paginação de propósito — é sempre um "top N" curto, mesmo padrão de /marcas.
export function listarProdutosMaisVendidos(
  limite: number,
  opcoes?: { next?: { revalidate?: number } },
): Promise<Produto[]> {
  return api.get<Produto[]>(`/produtos/mais-vendidos?limite=${limite}`, opcoes);
}

export function listarImagensProduto(
  produtoId: string,
  opcoes?: { signal?: AbortSignal },
): Promise<ImagemProduto[]> {
  return api.get<ImagemProduto[]>(`/produtos/${produtoId}/imagens`, opcoes);
}
