import { Injectable } from '@nestjs/common';
import {
  ResolverCarrinhoSessaoUseCase,
  calcularExpiracao,
} from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { ProdutoNaoEncontradoException } from '../../produtos/domain/produtos.exceptions';

/**
 * Só valida que o produto existe e está ativo — de propósito, NÃO valida estoque
 * aqui (carrinho é referência viva ao catálogo, não uma reserva; validar estoque no
 * momento de adicionar rejeitaria por uma leitura que já pode estar desatualizada no
 * instante seguinte). Estoque de verdade é revalidado em VisualizarCarrinhoUseCase e,
 * pra valer, no checkout (MontarCarrinhoUseCase).
 */
@Injectable()
export class AdicionarItemCarrinhoUseCase {
  constructor(
    private readonly resolverCarrinhoSessaoUseCase: ResolverCarrinhoSessaoUseCase,
    private readonly carrinhoSessaoRepository: CarrinhoSessaoRepository,
    private readonly produtoRepository: ProdutoRepository,
  ) {}

  async executar(
    sessionToken: string | undefined,
    clienteId: string | undefined,
    produtoId: string,
    quantidade: number,
  ): Promise<string> {
    const produto = await this.produtoRepository.buscarPorId(produtoId);
    if (!produto || !produto.ativo) {
      throw new ProdutoNaoEncontradoException(produtoId);
    }

    const { carrinho, sessionTokenNovo } = await this.resolverCarrinhoSessaoUseCase.executar(
      sessionToken,
      clienteId,
      true,
    );
    // carrinho nunca é undefined aqui: criarSeNaoExistir: true garante criação.
    const carrinhoResolvido = carrinho!;

    await this.carrinhoSessaoRepository.upsertItem(
      carrinhoResolvido.id,
      produtoId,
      quantidade,
      calcularExpiracao(),
    );

    return sessionTokenNovo ?? carrinhoResolvido.sessionToken;
  }
}
