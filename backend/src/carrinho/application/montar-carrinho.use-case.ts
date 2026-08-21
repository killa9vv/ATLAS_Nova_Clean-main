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

    const produtos = await this.produtoRepository.buscarPorIds(
      itensSolicitados.map((item) => item.produtoId),
    );
    const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]));

    const itens = itensSolicitados.map((solicitado) => {
      const produto = produtosPorId.get(solicitado.produtoId);
      if (!produto) {
        throw new ProdutoNaoEncontradoException(solicitado.produtoId);
      }
      if (!produto.possuiEstoqueDisponivel(solicitado.quantidade)) {
        throw new EstoqueInsuficienteException(produto.nome);
      }
      return new ItemPrecificado(produto.id, produto.nome, solicitado.quantidade, produto.preco);
    });

    return new Carrinho(itens);
  }
}
