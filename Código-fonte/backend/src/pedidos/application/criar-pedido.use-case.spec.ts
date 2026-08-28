/// <reference types="jest" />

import { ConfigService } from '@nestjs/config';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoVazioException } from '../../carrinho/domain/carrinho.exceptions';
import { ShippingService } from '../../shipping/domain/shipping.service';
import { PedidoRepository } from '../domain/pedido.repository';
import { StatusPedido } from '../domain/status-pedido.enum';
import { CriarPedidoUseCase } from './criar-pedido.use-case';

describe('CriarPedidoUseCase', () => {
  let useCase: CriarPedidoUseCase;
  let montarCarrinhoUseCase: jest.Mocked<MontarCarrinhoUseCase>;
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let shippingService: jest.Mocked<ShippingService>;
  let configService: jest.Mocked<ConfigService>;

  const carrinho = {
    itens: [
      {
        produtoId: 'produto-1',
        nome: 'Detergente',
        quantidade: 2,
        precoUnitario: 10,
        subtotal: 20,
        pesoKg: 1,
        alturaCm: 10,
        larguraCm: 15,
        comprimentoCm: 20,
      },
    ],
    total: 20,
  };

  beforeEach(() => {
    montarCarrinhoUseCase = {
      executar: jest.fn(),
    } as unknown as jest.Mocked<MontarCarrinhoUseCase>;

    pedidoRepository = {
      criar: jest.fn(),
      buscarPorId: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<PedidoRepository>;

    shippingService = {
      cotar: jest.fn(),
    } as unknown as jest.Mocked<ShippingService>;

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    useCase = new CriarPedidoUseCase(
      montarCarrinhoUseCase,
      pedidoRepository,
      shippingService,
      configService,
    );

    montarCarrinhoUseCase.executar.mockResolvedValue(carrinho);

    configService.get.mockReturnValue('01001000');

    shippingService.cotar.mockResolvedValue({
      valor: 10,
      prazoDias: 5,
      servico: 'PAC',
    });

    pedidoRepository.criar.mockResolvedValue({} as never);
  });

  it('não cria o pedido quando o carrinho é inválido (ex: vazio)', async () => {
    montarCarrinhoUseCase.executar.mockRejectedValue(new CarrinhoVazioException());

    await expect(useCase.executar([])).rejects.toBeInstanceOf(CarrinhoVazioException);

    expect(pedidoRepository.criar).not.toHaveBeenCalled();
    expect(shippingService.cotar).not.toHaveBeenCalled();
  });

  it('exige CEP de destino após validar o carrinho', async () => {
    await expect(useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }])).rejects.toThrow(
      'CEP de destino é obrigatório.',
    );

    expect(shippingService.cotar).not.toHaveBeenCalled();
    expect(pedidoRepository.criar).not.toHaveBeenCalled();
  });

  it('exige CEP de origem configurado', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }], 'site', '20040002'),
    ).rejects.toThrow('CEP_ORIGEM não configurado.');

    expect(shippingService.cotar).not.toHaveBeenCalled();
    expect(pedidoRepository.criar).not.toHaveBeenCalled();
  });

  it('cota o frete e persiste o pedido com frete rateado', async () => {
    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }], 'site', '20040002');

    expect(shippingService.cotar).toHaveBeenCalledWith('01001000', '20040002', [
      {
        produtoId: 'produto-1',
        quantidade: 2,
        pesoKg: 1,
        alturaCm: 10,
        larguraCm: 15,
        comprimentoCm: 20,
        valorUnitario: 10,
      },
    ]);

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [
        {
          produtoId: 'produto-1',
          nome: 'Detergente',
          quantidade: 2,
          precoUnitario: 10,
          freteRateado: 10,
        },
      ],
      20,
      undefined,
      undefined,
      10,
    );
  });

  it('registra o pedido em AGUARDANDO_CONTATO quando o canal é whatsapp', async () => {
    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }], 'whatsapp', '20040002');

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      expect.any(Array),
      20,
      StatusPedido.AGUARDANDO_CONTATO,
      undefined,
      10,
    );
  });

  it('rateia o frete proporcionalmente pelo peso', async () => {
    montarCarrinhoUseCase.executar.mockResolvedValue({
      itens: [
        {
          produtoId: 'produto-1',
          nome: 'Produto 1',
          quantidade: 1,
          precoUnitario: 10,
          subtotal: 10,
          pesoKg: 1,
          alturaCm: 10,
          larguraCm: 10,
          comprimentoCm: 10,
        },
        {
          produtoId: 'produto-2',
          nome: 'Produto 2',
          quantidade: 1,
          precoUnitario: 20,
          subtotal: 20,
          pesoKg: 2,
          alturaCm: 10,
          larguraCm: 10,
          comprimentoCm: 10,
        },
      ],
      total: 30,
    });

    shippingService.cotar.mockResolvedValue({
      valor: 30,
    });

    await useCase.executar(
      [
        { produtoId: 'produto-1', quantidade: 1 },
        { produtoId: 'produto-2', quantidade: 1 },
      ],
      'site',
      '20040002',
    );

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          produtoId: 'produto-1',
          freteRateado: 10,
        }),
        expect.objectContaining({
          produtoId: 'produto-2',
          freteRateado: 20,
        }),
      ],
      30,
      undefined,
      undefined,
      30,
    );
  });

  it('não calcula frete quando produto não possui dados físicos', async () => {
    montarCarrinhoUseCase.executar.mockResolvedValue({
      itens: [
        {
          produtoId: 'produto-1',
          nome: 'Produto sem peso',
          quantidade: 1,
          precoUnitario: 10,
          subtotal: 10,
        },
      ],
      total: 10,
    });

    await expect(
      useCase.executar([{ produtoId: 'produto-1', quantidade: 1 }], 'site', '20040002'),
    ).rejects.toThrow('Produto produto-1 não possui dados físicos para cálculo de frete.');

    expect(shippingService.cotar).not.toHaveBeenCalled();
    expect(pedidoRepository.criar).not.toHaveBeenCalled();
  });
});
