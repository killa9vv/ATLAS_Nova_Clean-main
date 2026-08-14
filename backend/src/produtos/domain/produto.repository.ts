import { Produto } from './produto.entity';

export interface ItemParaDecrementarEstoque {
  produtoId: string;
  nome: string;
  quantidade: number;
}

/**
 * Porta do repositório de produtos. A camada de domínio/aplicação depende
 * apenas desta abstração — quem implementa é a infraestrutura (Prisma).
 */
export abstract class ProdutoRepository {
  abstract listarTodos(): Promise<Produto[]>;
  abstract buscarPorId(id: string): Promise<Produto | null>;
  abstract buscarPorIds(ids: string[]): Promise<Produto[]>;

  /**
   * Decrementa o estoque de cada item de forma atômica (tudo ou nada): se algum
   * item não tiver estoque suficiente no momento da escrita, nenhum é decrementado.
   * Existe para fechar a janela de corrida entre a validação de estoque (leitura)
   * e a criação do pedido — duas compras concorrentes não podem vender o mesmo
   * último item.
   */
  abstract decrementarEstoque(itens: ItemParaDecrementarEstoque[]): Promise<void>;
}
