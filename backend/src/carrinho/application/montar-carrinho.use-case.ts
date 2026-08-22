import { Injectable } from '@nestjs/common';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../../produtos/domain/produtos.exceptions';
import { Carrinho, ItemPrecificado } from '../domain/item-precificado';
import { CarrinhoItemSolicitado } from '../domain/carrinho-item-solicitado';
import { CarrinhoVazioException, EstoqueInsuficienteException } from '../domain/carrinho.exceptions';

/**
 * Valida os itens pedidos contra o catálogo de produtos (existência e estoque)
 * e monta um Carrinho com preços atuais. Usado tanto pela pré-visualização do
 * carrinho quanto pela criação de pedidos, para nunca confiar em preço vindo do cliente.
 */
@Injectable()
export class MontarCarrinhoUseCase {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async executar(itensSolicitados: CarrinhoItemSolicitado[]): Promise<Carrinho> {
    if (!itensSolicitados.length) {
      throw new CarrinhoVazioException();
    }

    // Consolida quantidades do mesmo produto antes de validar estoque — senão o
    // mesmo produtoId repetido em duas linhas passaria na checagem de estoque
    // duas vezes de forma isolada (5 em estoque, duas linhas de 3 cada "cabem"
    // individualmente, mas juntas excedem o disponível).
    const quantidadePorProduto = new Map<string, number>();
    for (const item of itensSolicitados) {
      quantidadePorProduto.set(
        item.produtoId,
        (quantidadePorProduto.get(item.produtoId) ?? 0) + item.quantidade,
      );
    }

    const produtos = await this.produtoRepository.buscarPorIds([...quantidadePorProduto.keys()]);
    const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

    const itens = [...quantidadePorProduto.entries()].map(([produtoId, quantidade]) => {
      const produto = produtosPorId.get(produtoId);
      if (!produto) {
        throw new ProdutoNaoEncontradoException(produtoId);
      }
      if (!produto.possuiEstoqueDisponivel(quantidade)) {
        throw new EstoqueInsuficienteException(produto.nome);
      }
      return new ItemPrecificado(produto.id, produto.nome, quantidade, produto.preco);
    });

    return new Carrinho(itens);
  }
}
