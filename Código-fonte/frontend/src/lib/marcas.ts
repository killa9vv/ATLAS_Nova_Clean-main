import { api } from '@/lib/http';

export interface Marca {
  id: string;
  nome: string;
  imagemUrl?: string;
  ativo: boolean;
}

// GET /marcas é público (a loja usa pro carrossel de marcas da home e no catálogo).
// ativo=true sempre aqui — só a loja consome esta função hoje, diferente de listarProdutos
// (que tem variante admin); crie uma função separada se um painel de marcas precisar
// ver as inativas no futuro.
export function listarMarcas(opcoes?: {
  next?: { revalidate?: number };
  signal?: AbortSignal;
}): Promise<Marca[]> {
  return api.get<Marca[]>('/marcas?ativo=true', opcoes);
}
