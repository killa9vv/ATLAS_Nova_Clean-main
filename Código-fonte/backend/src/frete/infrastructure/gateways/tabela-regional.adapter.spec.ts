import { TabelaRegionalShippingQuoteProvider } from './tabela-regional.adapter';

describe('TabelaRegionalShippingQuoteProvider', () => {
  const provider = new TabelaRegionalShippingQuoteProvider();

  it('cotação mais barata e rápida pra Campos dos Goytacazes (entrega local)', async () => {
    const cotacao = await provider.cotar({
      cepDestino: '28013-000',
      quantidadeItens: 1,
      valorDeclarado: 50,
    });

    expect(cotacao.valor).toBe(12);
    expect(cotacao.prazoEstimadoDias).toBe(1);
    expect(cotacao.origem).toBe('TABELA_REGIONAL');
  });

  it('cotação intermediária pro resto do Rio de Janeiro', async () => {
    const cotacao = await provider.cotar({
      cepDestino: '20040-020', // Rio de Janeiro capital
      quantidadeItens: 1,
      valorDeclarado: 50,
    });

    expect(cotacao.valor).toBe(25);
  });

  it('nunca falha: CEP fora do Rio de Janeiro cai na faixa "fora da região"', async () => {
    const cotacao = await provider.cotar({
      cepDestino: '01310-100', // São Paulo capital
      quantidadeItens: 1,
      valorDeclarado: 50,
    });

    expect(cotacao.valor).toBe(45);
    expect(cotacao.origem).toBe('TABELA_REGIONAL');
  });
});
