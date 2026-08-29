import { ShippingQuoteProviderComFallback } from './shipping-quote-com-fallback.adapter';
import { ShippingQuoteProvider } from '../../domain/shipping-quote.port';
import { CotacaoFrete } from '../../domain/frete.entity';

// Cobre exatamente o cenário exigido pelo critério de pronto: fallback quando a
// API externa de frete falha ou expira o timeout.
describe('ShippingQuoteProviderComFallback', () => {
  let principal: jest.Mocked<ShippingQuoteProvider>;
  let contingencia: jest.Mocked<ShippingQuoteProvider>;
  let provider: ShippingQuoteProviderComFallback;

  const solicitacao = { cepDestino: '28013000', quantidadeItens: 1, valorDeclarado: 50 };

  beforeEach(() => {
    principal = { cotar: jest.fn() } as unknown as jest.Mocked<ShippingQuoteProvider>;
    contingencia = { cotar: jest.fn() } as unknown as jest.Mocked<ShippingQuoteProvider>;
    provider = new ShippingQuoteProviderComFallback(principal, contingencia);
  });

  it('usa a cotação da API principal quando ela responde normalmente', async () => {
    principal.cotar.mockResolvedValue(new CotacaoFrete(18.9, 8, 'API'));

    const cotacao = await provider.cotar(solicitacao);

    expect(cotacao.origem).toBe('API');
    expect(contingencia.cotar).not.toHaveBeenCalled();
  });

  it('cai pra tabela regional quando a API externa expira o timeout', async () => {
    principal.cotar.mockRejectedValue(new Error('timeout of 8000ms exceeded'));
    contingencia.cotar.mockResolvedValue(new CotacaoFrete(12, 1, 'TABELA_REGIONAL'));

    const cotacao = await provider.cotar(solicitacao);

    expect(cotacao.origem).toBe('TABELA_REGIONAL');
    expect(cotacao.valor).toBe(12);
    expect(contingencia.cotar).toHaveBeenCalledWith(solicitacao);
  });

  it('cai pra tabela regional quando a API externa falha por qualquer outro motivo (ex.: credencial ausente)', async () => {
    principal.cotar.mockRejectedValue(new Error('FRETE_CEP_ORIGEM não configurado'));
    contingencia.cotar.mockResolvedValue(new CotacaoFrete(45, 7, 'TABELA_REGIONAL'));

    const cotacao = await provider.cotar(solicitacao);

    expect(cotacao.origem).toBe('TABELA_REGIONAL');
  });

  it('propaga o erro se até a contingência falhar (nunca deveria acontecer pra CEP válido)', async () => {
    principal.cotar.mockRejectedValue(new Error('timeout'));
    contingencia.cotar.mockRejectedValue(new Error('indisponível'));

    await expect(provider.cotar(solicitacao)).rejects.toThrow('indisponível');
  });
});
