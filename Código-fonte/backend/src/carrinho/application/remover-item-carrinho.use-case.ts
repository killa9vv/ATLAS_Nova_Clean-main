import { Injectable } from '@nestjs/common';
import { ResolverCarrinhoSessaoUseCase } from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';

@Injectable()
export class RemoverItemCarrinhoUseCase {
  constructor(
    private readonly resolverCarrinhoSessaoUseCase: ResolverCarrinhoSessaoUseCase,
    private readonly carrinhoSessaoRepository: CarrinhoSessaoRepository,
  ) {}

  async executar(
    sessionToken: string | undefined,
    clienteId: string | undefined,
    produtoId: string,
  ): Promise<string | undefined> {
    const { carrinho } = await this.resolverCarrinhoSessaoUseCase.executar(
      sessionToken,
      clienteId,
      false,
    );
    if (!carrinho) return sessionToken;

    await this.carrinhoSessaoRepository.removerItem(carrinho.id, produtoId);
    return carrinho.sessionToken;
  }
}
