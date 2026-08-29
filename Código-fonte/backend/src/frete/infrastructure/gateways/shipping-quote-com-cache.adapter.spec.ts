import { ShippingQuoteProviderComCache } from './shipping-quote-com-cache.adapter';
import { ShippingQuoteProvider } from '../../domain/shipping-quote.port';
import { CotacaoFrete } from '../../domain/frete.entity';

describe('ShippingQuoteProviderComCache', () => {
  let interno: jest.Mocked<ShippingQuoteProvider>;
  let provider: ShippingQuoteProviderComCache;

  const solicitacao = { cepDestino: '28013000', quantidadeItens: 1, valorDeclarado: 50 };

  beforeEach(() => {
    interno = { cotar: jest.fn() } as unknown as jest.Mocked<ShippingQuoteProvider>;
    interno.cotar.mockResolvedValue(new CotacaoFrete(20, 5, 'API'));
    provider = new ShippingQuoteProviderComCache(interno);
  });

  afterEach(() => jest.restoreAllMocks());

  it('reutiliza a cotação enquanto estiver no cache', async () => {
    await provider.cotar(solicitacao);
    await provider.cotar(solicitacao);

    expect(interno.cotar).toHaveBeenCalledTimes(1);
  });

  it('faz nova cotação quando o CEP de destino muda', async () => {
    await provider.cotar(solicitacao);
    await provider.cotar({ ...solicitacao, cepDestino: '30140071' });

    expect(interno.cotar).toHaveBeenCalledTimes(2);
  });

  it('faz nova cotação quando o carrinho (itens) muda', async () => {
    await provider.cotar({
      ...solicitacao,
      itens: [
        { produtoId: 'a', quantidade: 1, pesoKg: 1, alturaCm: 1, larguraCm: 1, comprimentoCm: 1 },
      ],
    });
    await provider.cotar({
      ...solicitacao,
      itens: [
        { produtoId: 'a', quantidade: 2, pesoKg: 1, alturaCm: 1, larguraCm: 1, comprimentoCm: 1 },
      ],
    });

    expect(interno.cotar).toHaveBeenCalledTimes(2);
  });

  it('refaz a cotação depois de 15 minutos', async () => {
    const agora = 1_000;
    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(agora);

    await provider.cotar(solicitacao);

    nowSpy.mockReturnValue(agora + 15 * 60 * 1000 + 1);

    await provider.cotar(solicitacao);

    expect(interno.cotar).toHaveBeenCalledTimes(2);
  });
});
