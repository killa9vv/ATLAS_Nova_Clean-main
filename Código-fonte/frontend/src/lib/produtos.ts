import { api } from '@/lib/http';

export interface Produto {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  estoque: number;
  ativo: boolean;
}

export interface ProdutoPaginado {
  itens: Produto[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface ImagemProduto {
  id: string;
  produtoId: string;
  url: string;
  thumbnailUrl: string;
  ordem: number;
  principal: boolean;
}

// Loja pública: sempre ativo=true, diferente do admin (que precisa ver inativos também).
export function listarProdutos(params: {
  pagina: number;
  limite: number;
  busca?: string;
}): Promise<ProdutoPaginado> {
  const query = new URLSearchParams({
    pagina: String(params.pagina),
    limite: String(params.limite),
    ativo: 'true',
  });
  if (params.busca) query.set('busca', params.busca);
  return api.get<ProdutoPaginado>(`/produtos?${query.toString()}`);
}

export function listarImagensProduto(produtoId: string): Promise<ImagemProduto[]> {
  return api.get<ImagemProduto[]>(`/produtos/${produtoId}/imagens`);
}
