export interface ShippingAllocationItem {
  produtoId: string;
  quantidade: number;
  pesoKg: number;
}

export interface ShippingAllocation {
  produtoId: string;
  freteRateado: number;
}

/** Rateia o valor total de frete entre os itens do pedido, proporcional ao peso
 * (quantidade × pesoKg) de cada um — usado só quando tipoEntrega é ENTREGA;
 * RETIRADA nunca chama isso (não há frete pra ratear). */
export class ShippingAllocator {
  ratearPorPeso(freteTotal: number, itens: ShippingAllocationItem[]): ShippingAllocation[] {
    if (freteTotal < 0) {
      throw new Error('O frete total não pode ser negativo.');
    }

    if (!itens.length) {
      throw new Error('Não é possível ratear frete sem itens.');
    }

    const pesos = itens.map((item) => item.pesoKg * item.quantidade);
    const pesoTotal = pesos.reduce((soma, peso) => soma + peso, 0);

    if (pesoTotal <= 0) {
      throw new Error('O peso total do pedido deve ser maior que zero.');
    }

    // Distribui em centavos, e não em ponto flutuante direto, pra nunca sobrar/faltar
    // centavo por arredondamento — o resto de arredondamento cai sempre no último item.
    const freteCentavos = Math.round(freteTotal * 100);
    let centavosDistribuidos = 0;

    return itens.map((item, index) => {
      const ultimoItem = index === itens.length - 1;

      const centavos = ultimoItem
        ? freteCentavos - centavosDistribuidos
        : Math.floor((freteCentavos * pesos[index]) / pesoTotal);

      centavosDistribuidos += centavos;

      return {
        produtoId: item.produtoId,
        freteRateado: centavos / 100,
      };
    });
  }
}
