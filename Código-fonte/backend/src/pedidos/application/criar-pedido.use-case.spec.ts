// Testes do CriarPedidoUseCase. O decremento de estoque NÃO acontece aqui — só na
// confirmação do pagamento (ver ProcessarWebhookUseCase e a decisão documentada no
// README raiz). Este use case só valida o carrinho (via MontarCarrinhoUseCase, que já
// faz a checagem de estoque em leitura), calcula o frete (via CalcularFreteUseCase, só
// quando tipoEntrega é ENTREGA) e o rateia entre os itens (via ShippingAllocator), e
// persiste o pedido.
import { CriarPedidoUseCase } from './criar-pedido.use-case';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoVazioException } from '../../carrinho/domain/carrinho.exceptions';
import { Carrinho, ItemPrecificado } from '../../carrinho/domain/item-precificado';
import { CalcularFreteUseCase } from '../../frete/application/calcular-frete.use-case';
import { OpcaoFrete } from '../../frete/domain/frete.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';

describe('CriarPedidoUseCase', () => {
  let montarCarrinhoUseCase: jest.Mocked<MontarCarrinhoUseCase>;
  let calcularFreteUseCase: jest.Mocked<CalcularFreteUseCase>;
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let useCase: CriarPedidoUseCase;

  const carrinho = new Carrinho([new ItemPrecificado('produto-1', 'Detergente', 2, 10)]);
  const endereco = {
    cep: '28013-000',
    logradouro: 'Rua do Sol',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Campos dos Goytacazes',
    estado: 'RJ',
  };

  beforeEach(() => {
    montarCarrinhoUseCase = {
      executar: jest.fn().mockResolvedValue(carrinho),
    } as unknown as jest.Mocked<MontarCarrinhoUseCase>;

    calcularFreteUseCase = {
      executar: jest.fn().mockResolvedValue({
        opcoes: [new OpcaoFrete('ENTREGA', 12, 3), new OpcaoFrete('RETIRADA', 0, 0)],
      }),
    } as unknown as jest.Mocked<CalcularFreteUseCase>;

    pedidoRepository = {
      criar: jest
        .fn()
        .mockResolvedValue(
          new Pedido(
            'pedido-1',
            StatusPedido.CRIADO,
            [],
            20,
            'RETIRADA',
            0,
            new Date(),
            new Date(),
          ),
        ),
      buscarPorId: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<PedidoRepository>;

    useCase = new CriarPedidoUseCase(montarCarrinhoUseCase, calcularFreteUseCase, pedidoRepository);
  });

  it('não cria o pedido quando o carrinho é inválido (ex: vazio)', async () => {
    montarCarrinhoUseCase.executar.mockRejectedValue(new CarrinhoVazioException());

    await expect(useCase.executar([], { tipoEntrega: 'RETIRADA' })).rejects.toBeInstanceOf(
      CarrinhoVazioException,
    );
    expect(pedidoRepository.criar).not.toHaveBeenCalled();
    expect(calcularFreteUseCase.executar).not.toHaveBeenCalled();
  });

  it('RETIRADA: persiste o pedido sem frete, sem ratear e sem consultar CalcularFreteUseCase', async () => {
    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }], {
      tipoEntrega: 'RETIRADA',
    });

    expect(calcularFreteUseCase.executar).not.toHaveBeenCalled();
    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [
        {
          produtoId: 'produto-1',
          nome: 'Detergente',
          quantidade: 2,
          precoUnitario: 10,
          freteRateado: 0,
        },
      ],
      carrinho.total,
      { tipoEntrega: 'RETIRADA', valorFrete: 0, endereco: undefined },
      undefined,
    );
  });

  it('ENTREGA (item único): soma o valor cotado ao total, grava o endereço e passa dados físicos reais pro CalcularFreteUseCase', async () => {
    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }], {
      tipoEntrega: 'ENTREGA',
      endereco,
    });

    expect(calcularFreteUseCase.executar).toHaveBeenCalledWith({
      cepDestino: endereco.cep,
      quantidadeItens: 2,
      valorDeclarado: carrinho.total,
      itens: [
        {
          produtoId: 'produto-1',
          quantidade: 2,
          pesoKg: undefined,
          alturaCm: undefined,
          larguraCm: undefined,
          comprimentoCm: undefined,
        },
      ],
    });
    // Item único: 100% do frete rateado pra ele.
    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [
        {
          produtoId: 'produto-1',
          nome: 'Detergente',
          quantidade: 2,
          precoUnitario: 10,
          freteRateado: 12,
        },
      ],
      carrinho.total + 12,
      { tipoEntrega: 'ENTREGA', valorFrete: 12, endereco },
      undefined,
    );
  });

  it('ENTREGA (múltiplos itens): rateia o frete proporcionalmente ao peso real de cada produto', async () => {
    const carrinhoComPeso = new Carrinho([
      new ItemPrecificado('produto-1', 'Produto 1', 1, 10, 1, 10, 10, 10),
      new ItemPrecificado('produto-2', 'Produto 2', 1, 20, 2, 10, 10, 10),
    ]);
    montarCarrinhoUseCase.executar.mockResolvedValue(carrinhoComPeso);
    calcularFreteUseCase.executar.mockResolvedValue({
      opcoes: [new OpcaoFrete('ENTREGA', 30, 3), new OpcaoFrete('RETIRADA', 0, 0)],
    });

    await useCase.executar(
      [
        { produtoId: 'produto-1', quantidade: 1 },
        { produtoId: 'produto-2', quantidade: 1 },
      ],
      { tipoEntrega: 'ENTREGA', endereco },
    );

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [
        expect.objectContaining({ produtoId: 'produto-1', freteRateado: 10 }),
        expect.objectContaining({ produtoId: 'produto-2', freteRateado: 20 }),
      ],
      30 + 30,
      { tipoEntrega: 'ENTREGA', valorFrete: 30, endereco },
      undefined,
    );
  });

  it('ENTREGA: usa um peso padrão no rateio quando o produto não tem pesoKg cadastrado (catálogo legado)', async () => {
    // Sem pesoKg (undefined) nos dois — ambos caem no mesmo piso (PESO_PADRAO_RATEIO_KG),
    // então o rateio deve dividir igualmente entre eles, não lançar por peso total zero.
    const carrinhoSemPeso = new Carrinho([
      new ItemPrecificado('produto-1', 'Produto 1', 1, 10),
      new ItemPrecificado('produto-2', 'Produto 2', 1, 10),
    ]);
    montarCarrinhoUseCase.executar.mockResolvedValue(carrinhoSemPeso);
    calcularFreteUseCase.executar.mockResolvedValue({
      opcoes: [new OpcaoFrete('ENTREGA', 20, 3), new OpcaoFrete('RETIRADA', 0, 0)],
    });

    await useCase.executar(
      [
        { produtoId: 'produto-1', quantidade: 1 },
        { produtoId: 'produto-2', quantidade: 1 },
      ],
      { tipoEntrega: 'ENTREGA', endereco },
    );

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [
        expect.objectContaining({ produtoId: 'produto-1', freteRateado: 10 }),
        expect.objectContaining({ produtoId: 'produto-2', freteRateado: 10 }),
      ],
      expect.any(Number),
      expect.objectContaining({ tipoEntrega: 'ENTREGA', valorFrete: 20 }),
      undefined,
    );
  });

  it('registra o pedido em AGUARDANDO_CONTATO quando o canal é whatsapp', async () => {
    await useCase.executar(
      [{ produtoId: 'produto-1', quantidade: 2 }],
      { tipoEntrega: 'RETIRADA' },
      'whatsapp',
    );

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [
        {
          produtoId: 'produto-1',
          nome: 'Detergente',
          quantidade: 2,
          precoUnitario: 10,
          freteRateado: 0,
        },
      ],
      carrinho.total,
      { tipoEntrega: 'RETIRADA', valorFrete: 0, endereco: undefined },
      StatusPedido.AGUARDANDO_CONTATO,
    );
  });
});
