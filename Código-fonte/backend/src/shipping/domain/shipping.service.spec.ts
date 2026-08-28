/// <reference types="jest" />

import { ShippingService } from './shipping.service';
import { ShippingItem, ShippingProvider } from './shipping.types';

describe('ShippingService', () => {
  let provider: jest.Mocked<ShippingProvider>;
  let service: ShippingService;

  const itens: ShippingItem[] = [
    {
      produtoId: 'produto-1',
      quantidade: 2,
      pesoKg: 1,
      alturaCm: 10,
      larguraCm: 20,
      comprimentoCm: 30,
      valorUnitario: 50,
    },
  ];

  beforeEach(() => {
    provider = {
      cotar: jest.fn(),
    };

    service = new ShippingService(provider);

    provider.cotar.mockResolvedValue({
      valor: 20,
      prazoDias: 5,
      servico: 'Teste',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retorna a cotação do provider', async () => {
    const resultado = await service.cotar('01001000', '20040002', itens);

    expect(resultado).toEqual({
      valor: 20,
      prazoDias: 5,
      servico: 'Teste',
    });

    expect(provider.cotar).toHaveBeenCalledTimes(1);
  });

  it('reutiliza a cotação enquanto estiver no cache', async () => {
    await service.cotar('01001000', '20040002', itens);
    await service.cotar('01001000', '20040002', itens);

    expect(provider.cotar).toHaveBeenCalledTimes(1);
  });

  it('faz nova cotação quando o CEP muda', async () => {
    await service.cotar('01001000', '20040002', itens);
    await service.cotar('01001000', '30140071', itens);

    expect(provider.cotar).toHaveBeenCalledTimes(2);
  });

  it('faz nova cotação quando o carrinho muda', async () => {
    await service.cotar('01001000', '20040002', itens);

    const itensAlterados: ShippingItem[] = [
      {
        ...itens[0],
        quantidade: 3,
      },
    ];

    await service.cotar('01001000', '20040002', itensAlterados);

    expect(provider.cotar).toHaveBeenCalledTimes(2);
  });

  it('faz nova cotação quando o valor do produto muda', async () => {
    await service.cotar('01001000', '20040002', itens);

    const itensAlterados: ShippingItem[] = [
      {
        ...itens[0],
        valorUnitario: 75,
      },
    ];

    await service.cotar('01001000', '20040002', itensAlterados);

    expect(provider.cotar).toHaveBeenCalledTimes(2);
  });

  it('normaliza CEP formatado antes de chamar o provider', async () => {
    await service.cotar('01001-000', '20040-002', itens);

    expect(provider.cotar).toHaveBeenCalledWith('01001000', '20040002', itens);
  });

  it('rejeita CEP inválido', async () => {
    await expect(service.cotar('123', '20040002', itens)).rejects.toThrow(
      'CEP de origem e destino devem conter exatamente 8 dígitos.',
    );

    expect(provider.cotar).not.toHaveBeenCalled();
  });

  it('rejeita produto sem dados físicos válidos', async () => {
    const itensInvalidos: ShippingItem[] = [
      {
        ...itens[0],
        pesoKg: 0,
      },
    ];

    await expect(service.cotar('01001000', '20040002', itensInvalidos)).rejects.toThrow(
      'não possui dados físicos válidos',
    );

    expect(provider.cotar).not.toHaveBeenCalled();
  });

  it('refaz a cotação após 15 minutos', async () => {
    const agora = 1_000;
    const nowSpy = jest.spyOn(Date, 'now');

    nowSpy.mockReturnValue(agora);

    await service.cotar('01001000', '20040002', itens);

    nowSpy.mockReturnValue(agora + 15 * 60 * 1000 + 1);

    await service.cotar('01001000', '20040002', itens);

    expect(provider.cotar).toHaveBeenCalledTimes(2);
  });
});
