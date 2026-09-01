import { adminApi } from '@/lib/admin-api';

export interface MarcaDoProdutoAdmin {
  id: string;
  nome: string;
  imagemUrl?: string;
}

export interface ProdutoAdmin {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  pesoKg?: number;
  alturaCm?: number;
  larguraCm?: number;
  comprimentoCm?: number;
  // "Nome" é o tipo genérico do produto (ex: "Pasta Catálogo com Elástico") — quando
  // o mesmo tipo tem mais de uma marca/embalagem, essas duas linhas ficam idênticas
  // na tabela sem isso. O backend já devolve os dois campos, só faltava aqui.
  pack?: string;
  marca?: MarcaDoProdutoAdmin;
}

export interface ProdutoPaginadoAdmin {
  itens: ProdutoAdmin[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface ImagemProdutoAdmin {
  id: string;
  produtoId: string;
  url: string;
  thumbnailUrl: string;
  ordem: number;
  principal: boolean;
}

export interface DadosProdutoForm {
  nome: string;
  descricao?: string;
  categoria?: string;
  preco: number;
  estoque?: number;
}

// GET /produtos é público (a loja usa) — sem ?ativo, devolve ativos e inativos,
// que é o que o admin precisa ver. adminApi só pra herdar o mesmo tratamento de
// erro/401 do resto do painel; a rota em si não exige token.
export function listarProdutosAdmin(params: {
  pagina: number;
  limite: number;
  busca?: string;
}): Promise<ProdutoPaginadoAdmin> {
  const query = new URLSearchParams({
    pagina: String(params.pagina),
    limite: String(params.limite),
  });
  if (params.busca) query.set('busca', params.busca);
  return adminApi.get<ProdutoPaginadoAdmin>(`/produtos?${query.toString()}`);
}

export function criarProdutoAdmin(dados: DadosProdutoForm): Promise<ProdutoAdmin> {
  return adminApi.post<ProdutoAdmin>('/produtos', dados);
}

export function atualizarProdutoAdmin(
  id: string,
  dados: Partial<DadosProdutoForm>,
): Promise<ProdutoAdmin> {
  return adminApi.put<ProdutoAdmin>(`/produtos/${id}`, dados);
}

export function alternarStatusProdutoAdmin(id: string, ativar: boolean): Promise<ProdutoAdmin> {
  return adminApi.patch<ProdutoAdmin>(`/produtos/${id}/${ativar ? 'ativar' : 'desativar'}`);
}

export function listarImagensProdutoAdmin(produtoId: string): Promise<ImagemProdutoAdmin[]> {
  return adminApi.get<ImagemProdutoAdmin[]>(`/produtos/${produtoId}/imagens`);
}

export function enviarImagemProdutoAdmin(
  produtoId: string,
  arquivo: File,
): Promise<ImagemProdutoAdmin> {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  return adminApi.post<ImagemProdutoAdmin>(`/produtos/${produtoId}/imagens`, formData);
}

export function removerImagemProdutoAdmin(produtoId: string, imagemId: string): Promise<void> {
  return adminApi.delete<void>(`/produtos/${produtoId}/imagens/${imagemId}`);
}

export function definirImagemPrincipalAdmin(produtoId: string, imagemId: string): Promise<void> {
  return adminApi.patch<void>(`/produtos/${produtoId}/imagens/${imagemId}/principal`);
}
