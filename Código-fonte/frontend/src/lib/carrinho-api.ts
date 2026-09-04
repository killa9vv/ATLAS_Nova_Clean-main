import { api } from '@/lib/http';
import { cartSessionHeader, salvarSessionToken } from '@/lib/carrinho-sessao';
import { obterSessaoCliente } from '@/lib/conta-auth';

export interface ItemCarrinhoServidor {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  disponivel: boolean;
  estoqueDisponivel: number;
}

export type MotivoIndisponibilidadeCarrinho = 'PRODUTO_INDISPONIVEL' | 'SEM_ESTOQUE';

export interface ItemCarrinhoIndisponivel {
  produtoId: string;
  /** Ausente só quando o produto sumiu de vez do catálogo. */
  nome?: string;
  motivo: MotivoIndisponibilidadeCarrinho;
}

export interface CarrinhoServidor {
  sessionToken?: string;
  itens: ItemCarrinhoServidor[];
  itensIndisponiveis: ItemCarrinhoIndisponivel[];
  total: number;
}

// Envia sessionToken (se houver carrinho anônimo local) e Authorization (se houver
// sessão de cliente) juntos — é assim que o backend resolve o carrinho certo e faz a
// "adoção" do carrinho anônimo pro cliente que acabou de logar.
function headersDaSessao(): HeadersInit {
  const sessao = obterSessaoCliente();
  return {
    ...cartSessionHeader(),
    ...(sessao ? { Authorization: `Bearer ${sessao.accessToken}` } : {}),
  };
}

// Toda resposta de carrinho traz sessionToken no corpo — persiste localmente sempre
// que vier preenchido (nunca sobrescreve com undefined, que é o caso de carrinho
// vazio "virtual" ainda não persistido, ver GET /carrinho sem token nenhum).
async function chamar(promessa: Promise<CarrinhoServidor>): Promise<CarrinhoServidor> {
  const resultado = await promessa;
  if (resultado.sessionToken) {
    salvarSessionToken(resultado.sessionToken);
  }
  return resultado;
}

export function buscarCarrinho(): Promise<CarrinhoServidor> {
  return chamar(api.get<CarrinhoServidor>('/carrinho', { headers: headersDaSessao() }));
}

export function adicionarItemCarrinho(
  produtoId: string,
  quantidade: number,
): Promise<CarrinhoServidor> {
  return chamar(
    api.post<CarrinhoServidor>(
      '/carrinho/itens',
      { produtoId, quantidade },
      { headers: headersDaSessao() },
    ),
  );
}

export function atualizarQuantidadeItemCarrinho(
  produtoId: string,
  quantidade: number,
): Promise<CarrinhoServidor> {
  return chamar(
    api.patch<CarrinhoServidor>(
      `/carrinho/itens/${produtoId}`,
      { quantidade },
      { headers: headersDaSessao() },
    ),
  );
}

export function removerItemCarrinho(produtoId: string): Promise<CarrinhoServidor> {
  return chamar(
    api.delete<CarrinhoServidor>(`/carrinho/itens/${produtoId}`, { headers: headersDaSessao() }),
  );
}

export function limparCarrinhoServidor(): Promise<CarrinhoServidor> {
  return chamar(api.delete<CarrinhoServidor>('/carrinho', { headers: headersDaSessao() }));
}
