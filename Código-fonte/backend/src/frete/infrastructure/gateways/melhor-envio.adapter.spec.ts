import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MelhorEnvioShippingQuoteProvider } from './melhor-envio.adapter';

jest.mock('axios');

const axiosMock = axios as jest.Mocked<typeof axios>;

function criarConfigService(valores: Record<string, string> = {}): ConfigService {
  return { get: jest.fn((chave: string) => valores[chave]) } as unknown as ConfigService;
}

describe('MelhorEnvioShippingQuoteProvider', () => {
  let httpMock: { post: jest.Mock };

  beforeEach(() => {
    httpMock = { post: jest.fn() };
    axiosMock.create.mockReturnValue(httpMock as any);
  });

  afterEach(() => jest.resetAllMocks());

  it('escolhe a opção mais barata entre as retornadas pela API', async () => {
    httpMock.post.mockResolvedValue({
      data: [
        { price: '32.50', delivery_time: 5 },
        { price: '18.90', delivery_time: 8 },
        { price: '99.00', delivery_time: 2 },
      ],
    });
    const provider = new MelhorEnvioShippingQuoteProvider(
      criarConfigService({ MELHOR_ENVIO_TOKEN: 'token', FRETE_CEP_ORIGEM: '28010000' }),
    );

    const cotacao = await provider.cotar({
      cepDestino: '28013000',
      quantidadeItens: 3,
      valorDeclarado: 150,
    });

    expect(cotacao.valor).toBe(18.9);
    expect(cotacao.prazoEstimadoDias).toBe(8);
    expect(cotacao.origem).toBe('API');
  });

  it('ignora opções com erro retornadas junto de opções válidas', async () => {
    httpMock.post.mockResolvedValue({
      data: [{ error: 'Intervalo de peso excedido' }, { price: '40.00', delivery_time: 4 }],
    });
    const provider = new MelhorEnvioShippingQuoteProvider(
      criarConfigService({ MELHOR_ENVIO_TOKEN: 'token', FRETE_CEP_ORIGEM: '28010000' }),
    );

    const cotacao = await provider.cotar({
      cepDestino: '28013000',
      quantidadeItens: 1,
      valorDeclarado: 50,
    });

    expect(cotacao.valor).toBe(40);
  });

  it('lança erro quando FRETE_CEP_ORIGEM não está configurado', async () => {
    const provider = new MelhorEnvioShippingQuoteProvider(criarConfigService());

    await expect(
      provider.cotar({ cepDestino: '28013000', quantidadeItens: 1, valorDeclarado: 50 }),
    ).rejects.toThrow();
    expect(httpMock.post).not.toHaveBeenCalled();
  });

  it('lança erro quando todas as opções retornadas têm erro', async () => {
    httpMock.post.mockResolvedValue({ data: [{ error: 'CEP não atendido' }] });
    const provider = new MelhorEnvioShippingQuoteProvider(
      criarConfigService({ MELHOR_ENVIO_TOKEN: 'token', FRETE_CEP_ORIGEM: '28010000' }),
    );

    await expect(
      provider.cotar({ cepDestino: '28013000', quantidadeItens: 1, valorDeclarado: 50 }),
    ).rejects.toThrow();
  });

  it('propaga erro de timeout/rede pra quem chamar (fallback decide o que fazer)', async () => {
    httpMock.post.mockRejectedValue({ isAxiosError: true, code: 'ECONNABORTED' });
    const provider = new MelhorEnvioShippingQuoteProvider(
      criarConfigService({ MELHOR_ENVIO_TOKEN: 'token', FRETE_CEP_ORIGEM: '28010000' }),
    );

    await expect(
      provider.cotar({ cepDestino: '28013000', quantidadeItens: 1, valorDeclarado: 50 }),
    ).rejects.toBeTruthy();
  });
});
