import { Injectable } from '@nestjs/common';
import { ShippingItem, ShippingProvider, ShippingQuote } from './shipping.types';

interface CachedQuote {
  quote: ShippingQuote;
  expiresAt: number;
}

@Injectable()
export class ShippingService {
  private readonly cache = new Map<string, CachedQuote>();

  private readonly cacheTtlMs = 15 * 60 * 1000;

  constructor(private readonly provider: ShippingProvider) {}

  async cotar(
    cepOrigem: string,
    cepDestino: string,
    itens: ShippingItem[],
  ): Promise<ShippingQuote> {
    const origem = cepOrigem.replace(/\D/g, '');
    const destino = cepDestino.replace(/\D/g, '');

    if (origem.length !== 8 || destino.length !== 8) {
      throw new Error('CEP de origem e destino devem conter exatamente 8 dígitos.');
    }

    if (!itens.length) {
      throw new Error('Não é possível calcular frete sem itens.');
    }

    for (const item of itens) {
      if (
        item.pesoKg <= 0 ||
        item.alturaCm <= 0 ||
        item.larguraCm <= 0 ||
        item.comprimentoCm <= 0
      ) {
        throw new Error(
          `Produto ${item.produtoId} não possui dados físicos válidos para cálculo de frete.`,
        );
      }
    }

    const chaveCache = this.criarChaveCache(origem, destino, itens);

    const agora = Date.now();
    const cacheExistente = this.cache.get(chaveCache);

    if (cacheExistente && cacheExistente.expiresAt > agora) {
      return cacheExistente.quote;
    }

    if (cacheExistente) {
      this.cache.delete(chaveCache);
    }

    const quote = await this.provider.cotar(origem, destino, itens);

    this.cache.set(chaveCache, {
      quote,
      expiresAt: agora + this.cacheTtlMs,
    });

    return quote;
  }

  private criarChaveCache(cepOrigem: string, cepDestino: string, itens: ShippingItem[]): string {
    const assinaturaItens = [...itens]
      .sort((a, b) => a.produtoId.localeCompare(b.produtoId))
      .map((item) =>
        [
          item.produtoId,
          item.quantidade,
          item.pesoKg,
          item.alturaCm,
          item.larguraCm,
          item.comprimentoCm,
          item.valorUnitario,
        ].join(':'),
      )
      .join('|');

    return `${cepOrigem}:${cepDestino}:${assinaturaItens}`;
  }
}
