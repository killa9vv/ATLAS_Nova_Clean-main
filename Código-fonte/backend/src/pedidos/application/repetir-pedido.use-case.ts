import { Injectable } from '@nestjs/common';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { BuscarPedidoDoClienteUseCase } from './buscar-pedido-do-cliente.use-case';

export interface ItemRepeticaoDisponivel {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  /** true quando a quantidade pedida originalmente foi reduzida pra caber no
   * estoque atual — frontend usa isso pra avisar o cliente. */
  ajustado: boolean;
}

export type MotivoIndisponibilidade = 'PRODUTO_INDISPONIVEL' | 'SEM_ESTOQUE';

export interface ItemRepeticaoIndisponivel {
  produtoId: string;
  /** Nome snapshot do pedido original — o produto pode não existir mais pra buscar o nome atual. */
  nome: string;
  motivo: MotivoIndisponibilidade;
}

export interface ResultadoRepeticaoPedido {
  itens: ItemRepeticaoDisponivel[];
  itensIndisponiveis: ItemRepeticaoIndisponivel[];
}

/**
 * "Repetir pedido" não persiste nada — devolve os itens prontos pro frontend jogar
 * no carrinho (local ou já persistido via POST /carrinho/itens, ver módulo
 * carrinho/), com preço ATUAL (nunca o snapshot antigo — mesma invariante de nunca
 * confiar em preço/estoque velho, ver MontarCarrinhoUseCase).
 *
 * Diferente de MontarCarrinhoUseCase (que lança exceção em estoque insuficiente):
 * aqui o objetivo é degradar graciosamente — item sem estoque suficiente entra
 * com quantidade reduzida (`ajustado: true`), item inativo/removido do catálogo
 * entra em `itensIndisponiveis` — nunca bloqueia a operação inteira por causa de
 * um item problemático.
 */
@Injectable()
export class RepetirPedidoUseCase {
  constructor(
    private readonly buscarPedidoDoClienteUseCase: BuscarPedidoDoClienteUseCase,
    private readonly produtoRepository: ProdutoRepository,
  ) {}

  async executar(pedidoId: string, clienteId: string): Promise<ResultadoRepeticaoPedido> {
    const pedido = await this.buscarPedidoDoClienteUseCase.executar(pedidoId, clienteId);

    const produtoIds = [...new Set(pedido.itens.map((item) => item.produtoId))];
    const produtos = await this.produtoRepository.buscarPorIds(produtoIds);
    const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

    const itens: ItemRepeticaoDisponivel[] = [];
    const itensIndisponiveis: ItemRepeticaoIndisponivel[] = [];

    for (const item of pedido.itens) {
      const produto = produtosPorId.get(item.produtoId);

      if (!produto || !produto.ativo) {
        itensIndisponiveis.push({
          produtoId: item.produtoId,
          nome: item.nome,
          motivo: 'PRODUTO_INDISPONIVEL',
        });
        continue;
      }

      if (produto.estoque <= 0) {
        itensIndisponiveis.push({
          produtoId: item.produtoId,
          nome: produto.nome,
          motivo: 'SEM_ESTOQUE',
        });
        continue;
      }

      const quantidadeDisponivel = Math.min(item.quantidade, produto.estoque);
      itens.push({
        produtoId: produto.id,
        nome: produto.nome,
        quantidade: quantidadeDisponivel,
        precoUnitario: produto.preco,
        ajustado: quantidadeDisponivel < item.quantidade,
      });
    }

    return { itens, itensIndisponiveis };
  }
}
