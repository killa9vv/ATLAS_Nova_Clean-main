import { Injectable } from '@nestjs/common';
import { CotacaoFrete } from '../../domain/frete.entity';
import { ShippingQuoteProvider, SolicitacaoCotacaoFrete } from '../../domain/shipping-quote.port';

interface CotacaoEmCache {
  cotacao: CotacaoFrete;
  expiraEm: number;
}

const TTL_CACHE_MS = 15 * 60 * 1000;

/**
 * Decorator que cacheia a cotação final (já resolvida pelo composite de fallback)
 * por 15min, chaveada por CEP de destino + dados do carrinho — evita golpear a API
 * do Melhor Envio de novo pro mesmo carrinho/CEP (ex.: usuário voltando pro checkout
 * várias vezes). É esta classe (não `ShippingQuoteProviderComFallback` direto) que
 * fica registrada como `ShippingQuoteProvider` no módulo.
 */
@Injectable()
export class ShippingQuoteProviderComCache extends ShippingQuoteProvider {
  private readonly cache = new Map<string, CotacaoEmCache>();

  constructor(private readonly interno: ShippingQuoteProvider) {
    super();
  }

  async cotar(solicitacao: SolicitacaoCotacaoFrete): Promise<CotacaoFrete> {
    const chave = this.criarChave(solicitacao);
    const agora = Date.now();
    const emCache = this.cache.get(chave);

    if (emCache && emCache.expiraEm > agora) {
      return emCache.cotacao;
    }

    const cotacao = await this.interno.cotar(solicitacao);
    this.cache.set(chave, { cotacao, expiraEm: agora + TTL_CACHE_MS });
    return cotacao;
  }

  private criarChave(solicitacao: SolicitacaoCotacaoFrete): string {
    const assinaturaItens = (solicitacao.itens ?? [])
      .map((item) =>
        [
          item.produtoId,
          item.quantidade,
          item.pesoKg,
          item.alturaCm,
          item.larguraCm,
          item.comprimentoCm,
        ].join(':'),
      )
      .sort()
      .join('|');

    return [
      solicitacao.cepDestino,
      solicitacao.quantidadeItens,
      solicitacao.valorDeclarado,
      assinaturaItens,
    ].join('#');
  }
}
