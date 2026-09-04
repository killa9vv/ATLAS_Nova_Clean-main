import { Injectable } from '@nestjs/common';
import {
  ResolverCarrinhoSessaoUseCase,
  calcularExpiracao,
} from './resolver-carrinho-sessao.use-case';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';

/** Define a quantidade absoluta de um item (não incrementa). Quantidade 0 remove —
 * mesma regra que o carrinho local de hoje já usa (ver cart-context.tsx). Se não
 * existe carrinho pra essa sessão/cliente, é um no-op (nada pra atualizar). */
@Injectable()
export class AtualizarQuantidadeItemCarrinhoUseCase {
  constructor(
    private readonly resolverCarrinhoSessaoUseCase: ResolverCarrinhoSessaoUseCase,
    private readonly carrinhoSessaoRepository: CarrinhoSessaoRepository,
  ) {}

  async executar(
    sessionToken: string | undefined,
    clienteId: string | undefined,
    produtoId: string,
    quantidade: number,
  ): Promise<string | undefined> {
    const { carrinho } = await this.resolverCarrinhoSessaoUseCase.executar(
      sessionToken,
      clienteId,
      false,
    );
    if (!carrinho) return sessionToken;

    if (quantidade <= 0) {
      await this.carrinhoSessaoRepository.removerItem(carrinho.id, produtoId);
    } else {
      await this.carrinhoSessaoRepository.definirQuantidadeItem(
        carrinho.id,
        produtoId,
        quantidade,
        calcularExpiracao(),
      );
    }

    return carrinho.sessionToken;
  }
}
