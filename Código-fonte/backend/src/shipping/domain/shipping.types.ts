export interface ShippingItem {
  produtoId: string;
  quantidade: number;
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
  valorUnitario: number;
}

export interface ShippingQuote {
  valor: number;
  prazoDias?: number;
  servico?: string;
}

export abstract class ShippingProvider {
  abstract cotar(
    cepOrigem: string,
    cepDestino: string,
    itens: ShippingItem[],
  ): Promise<ShippingQuote>;
}
