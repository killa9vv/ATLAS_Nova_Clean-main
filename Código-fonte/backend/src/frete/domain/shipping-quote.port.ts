import { CotacaoFrete } from './frete.entity';

export interface SolicitacaoCotacaoFrete {
  cepDestino: string;
  /** Soma das quantidades de itens do carrinho — usada como proxy de peso/volume (ver trade-offs). */
  quantidadeItens: number;
  /** Valor total do carrinho — usado como valor declarado/segurado na cotação. */
  valorDeclarado: number;
}

/**
 * Porta de cotação de frete. O domínio/aplicação não sabe se a implementação
 * concreta é uma API externa (Melhor Envio) ou uma tabela regional própria —
 * ver infrastructure/gateways para as implementações e o composite de fallback
 * que decide entre elas.
 *
 * Retorna sempre UMA cotação coerente (nunca lança por "não ter cotação"): a
 * implementação usada em produção (ShippingQuoteProviderComFallback) garante isso
 * caindo para a tabela regional quando a API externa falha ou expira o timeout.
 */
export abstract class ShippingQuoteProvider {
  abstract cotar(solicitacao: SolicitacaoCotacaoFrete): Promise<CotacaoFrete>;
}
