import { Injectable } from '@nestjs/common';
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';

/** Esvazia o carrinho (todos os itens) — chamado pelo frontend depois que um pedido
 * é criado com sucesso a partir dele. Não deleta o carrinho em si, só os itens. */
@Injectable()
export class LimparCarrinhoUseCase {
  constructor(
    private readonly resolverCarrinhoSessaoUseCase: ResolverCarrinhoSessaoUseCase,
    private readonly carrinhoSessaoRepository: CarrinhoSessaoRepository,
  ) {}

  async executar(
    sessionToken: string | undefined,
    clienteId: string | undefined,
  ): Promise<string | undefined> {
    const { carrinho } = await this.resolverCarrinhoSessaoUseCase.executar(
      sessionToken,
      clienteId,
      false,
    );
    if (!carrinho) return sessionToken;

    await this.carrinhoSessaoRepository.limpar(carrinho.id);
    return carrinho.sessionToken;
  }
}
