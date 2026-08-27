import { ConfigService } from '@nestjs/config';
import { CalcularFreteUseCase } from './calcular-frete.use-case';
import { ShippingQuoteProvider } from '../domain/shipping-quote.port';
import { CotacaoFrete } from '../domain/frete.entity';
import { CepInvalidoException } from '../domain/frete.exceptions';

function criarConfigService(valores: Record<string, string> = {}): ConfigService {
  return { get: jest.fn((chave: string) => valores[chave]) } as unknown as ConfigService;
}

describe('CalcularFreteUseCase', () => {
  let shippingQuoteProvider: jest.Mocked<ShippingQuoteProvider>;

  beforeEach(() => {
    shippingQuoteProvider = { cotar: jest.fn() } as unknown as jest.Mocked<ShippingQuoteProvider>;
  });

  it('rejeita CEP com formato inválido sem consultar o provedor', async () => {
    const useCase = new CalcularFreteUseCase(shippingQuoteProvider, criarConfigService());

    await expect(
      useCase.executar({ cepDestino: '123', quantidadeItens: 1, valorDeclarado: 50 }),
    ).rejects.toBeInstanceOf(CepInvalidoException);
    expect(shippingQuoteProvider.cotar).not.toHaveBeenCalled();
  });

  it('retorna o valor cotado pelo provedor quando abaixo do limite de frete grátis', async () => {
    shippingQuoteProvider.cotar.mockResolvedValue(new CotacaoFrete(25, 3, 'TABELA_REGIONAL'));
    const useCase = new CalcularFreteUseCase(
      shippingQuoteProvider,
      criarConfigService({ FRETE_GRATIS_ACIMA_DE: '200' }),
    );

    const resultado = await useCase.executar({
      cepDestino: '28013000',
      quantidadeItens: 2,
      valorDeclarado: 100,
    });

    const entrega = resultado.opcoes.find((o) => o.tipo === 'ENTREGA')!;
    expect(entrega.valor).toBe(25);
    expect(entrega.prazoEstimadoDias).toBe(3);
  });

  it('zera o frete de ENTREGA quando o valor do carrinho atinge o limite configurado', async () => {
    shippingQuoteProvider.cotar.mockResolvedValue(new CotacaoFrete(25, 3, 'TABELA_REGIONAL'));
    const useCase = new CalcularFreteUseCase(
      shippingQuoteProvider,
      criarConfigService({ FRETE_GRATIS_ACIMA_DE: '200' }),
    );

    const resultado = await useCase.executar({
      cepDestino: '28013000',
      quantidadeItens: 5,
      valorDeclarado: 250,
    });

    const entrega = resultado.opcoes.find((o) => o.tipo === 'ENTREGA')!;
    expect(entrega.valor).toBe(0);
  });

  it('nunca aplica frete grátis quando FRETE_GRATIS_ACIMA_DE não está configurado', async () => {
    shippingQuoteProvider.cotar.mockResolvedValue(new CotacaoFrete(25, 3, 'TABELA_REGIONAL'));
    const useCase = new CalcularFreteUseCase(shippingQuoteProvider, criarConfigService());

    const resultado = await useCase.executar({
      cepDestino: '28013000',
      quantidadeItens: 5,
      valorDeclarado: 999_999,
    });

    expect(resultado.opcoes.find((o) => o.tipo === 'ENTREGA')!.valor).toBe(25);
  });

  it('sempre inclui a opção de retirada na loja com valor zero', async () => {
    shippingQuoteProvider.cotar.mockResolvedValue(new CotacaoFrete(25, 3, 'TABELA_REGIONAL'));
    const useCase = new CalcularFreteUseCase(shippingQuoteProvider, criarConfigService());

    const resultado = await useCase.executar({
      cepDestino: '28013000',
      quantidadeItens: 1,
      valorDeclarado: 10,
    });

    const retirada = resultado.opcoes.find((o) => o.tipo === 'RETIRADA')!;
    expect(retirada.valor).toBe(0);
    expect(retirada.prazoEstimadoDias).toBe(0);
  });
});
