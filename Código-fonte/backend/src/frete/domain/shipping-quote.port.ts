import { CotacaoFrete } from './frete.entity';

/** Dados físicos reais de um item do carrinho, quando o Produto os tem cadastrados
 * (ver Produto.pesoKg/alturaCm/larguraCm/comprimentoCm) — permite ao MelhorEnvioShippingQuoteProvider
 * montar pacotes reais em vez do pacote sintético padrão (ver DIMENSAO_PADRAO_CM). */
export interface ItemCotacaoFrete {
  produtoId: string;
  quantidade: number;
  pesoKg?: number;
  alturaCm?: number;
  larguraCm?: number;
  comprimentoCm?: number;
}

export interface SolicitacaoCotacaoFrete {
  cepDestino: string;
  /** Soma das quantidades de itens do carrinho — usada como proxy de peso/volume quando
   * `itens` não traz dados físicos reais (ver trade-offs). */
  quantidadeItens: number;
  /** Valor total do carrinho — usado como valor declarado/segurado na cotação. */
  valorDeclarado: number;
  /** Itens do carrinho com dados físicos reais, quando disponíveis. Opcional: produtos
   * cadastrados antes dessas colunas existirem não têm essa informação. */
  itens?: ItemCotacaoFrete[];
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
