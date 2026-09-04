import { CarrinhoSessao } from './carrinho-sessao';

/**
 * Porta do carrinho persistido. TTL (`expiraEm`) é sempre calculado pela camada de
 * aplicação e só repassado aqui pra gravar — o repositório não decide política de
 * expiração, só persiste (mesmo padrão de ProdutoRepository).
 */
export abstract class CarrinhoSessaoRepository {
  abstract buscarPorSessionToken(sessionToken: string): Promise<CarrinhoSessao | null>;
  abstract buscarPorClienteId(clienteId: string): Promise<CarrinhoSessao | null>;
  abstract criar(
    sessionToken: string,
    clienteId: string | undefined,
    expiraEm: Date,
  ): Promise<CarrinhoSessao>;
  abstract adotarPorCliente(carrinhoId: string, clienteId: string): Promise<void>;
  abstract upsertItem(
    carrinhoId: string,
    produtoId: string,
    quantidade: number,
    expiraEm: Date,
  ): Promise<void>;
  abstract definirQuantidadeItem(
    carrinhoId: string,
    produtoId: string,
    quantidade: number,
    expiraEm: Date,
  ): Promise<void>;
  abstract removerItem(carrinhoId: string, produtoId: string): Promise<void>;
  abstract limpar(carrinhoId: string): Promise<void>;
  /** Apaga carrinhos com `expiraEm` anterior a `antesDe` (e seus itens). Devolve
   * quantos carrinhos foram removidos, só pra log do scheduler. */
  abstract deletarExpirados(antesDe: Date): Promise<number>;
}
