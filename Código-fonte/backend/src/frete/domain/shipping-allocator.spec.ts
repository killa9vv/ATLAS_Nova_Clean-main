import { ShippingAllocator } from './shipping-allocator';

describe('ShippingAllocator', () => {
  const allocator = new ShippingAllocator();

  it('rateia o frete proporcionalmente ao peso', () => {
    const resultado = allocator.ratearPorPeso(30, [
      { produtoId: 'a', quantidade: 1, pesoKg: 1 },
      { produtoId: 'b', quantidade: 1, pesoKg: 2 },
    ]);

    expect(resultado).toEqual([
      { produtoId: 'a', freteRateado: 10 },
      { produtoId: 'b', freteRateado: 20 },
    ]);
  });

  it('coloca a diferença de centavos no último item', () => {
    const resultado = allocator.ratearPorPeso(10, [
      { produtoId: 'a', quantidade: 1, pesoKg: 1 },
      { produtoId: 'b', quantidade: 1, pesoKg: 1 },
      { produtoId: 'c', quantidade: 1, pesoKg: 1 },
    ]);

    expect(resultado).toEqual([
      { produtoId: 'a', freteRateado: 3.33 },
      { produtoId: 'b', freteRateado: 3.33 },
      { produtoId: 'c', freteRateado: 3.34 },
    ]);

    expect(resultado.reduce((soma, item) => soma + item.freteRateado, 0)).toBeCloseTo(10, 2);
  });

  it('considera a quantidade no peso total', () => {
    const resultado = allocator.ratearPorPeso(30, [
      { produtoId: 'a', quantidade: 2, pesoKg: 1 },
      { produtoId: 'b', quantidade: 1, pesoKg: 1 },
    ]);

    expect(resultado).toEqual([
      { produtoId: 'a', freteRateado: 20 },
      { produtoId: 'b', freteRateado: 10 },
    ]);
  });

  it('rejeita itens com peso total zero', () => {
    expect(() =>
      allocator.ratearPorPeso(10, [{ produtoId: 'a', quantidade: 1, pesoKg: 0 }]),
    ).toThrow('O peso total do pedido deve ser maior que zero.');
  });
});
