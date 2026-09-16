import { api } from '@/lib/http';

export interface Categoria {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
}

// GET /categorias é público — usado tanto pela loja (atalhos de categoria, filtro do
// catálogo) quanto pelo admin (seletor de categoria em CupomFormModal/RegraAtacadoFormModal).
// `ativo` fica a cargo de quem chama, mesmo espírito de listarProdutos: a loja passa
// true pra não mostrar categoria desativada; o admin não passa nada, pra continuar
// enxergando todas ao restringir um cupom/regra de atacado.
export function listarCategorias(
  filtros?: { ativo?: boolean },
  opcoes?: { next?: { revalidate?: number }; signal?: AbortSignal },
): Promise<Categoria[]> {
  const query = filtros?.ativo !== undefined ? `?ativo=${filtros.ativo}` : '';
  return api.get<Categoria[]>(`/categorias${query}`, opcoes);
}
