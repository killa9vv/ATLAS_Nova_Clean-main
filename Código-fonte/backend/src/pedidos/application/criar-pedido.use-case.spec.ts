// Testes do CriarPedidoUseCase. O decremento de estoque NÃO acontece aqui — só na
// confirmação do pagamento (ver ProcessarWebhookUseCase e a decisão documentada no
// README raiz). Este use case só valida o carrinho (via MontarCarrinhoUseCase, que já
// faz a checagem de estoque em leitura) e persiste o pedido.
import { CriarPedidoUseCase } from './criar-pedido.use-case';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoVazioException } from '../../carrinho/domain/carrinho.exceptions';
import { Carrinho, ItemPrecificado } from '../../carrinho/domain/item-precificado';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';

describe('CriarPedidoUseCase', () => {
  let montarCarrinhoUseCase: jest.Mocked<MontarCarrinhoUseCase>;
  let pedidoRepository: jest.Mocked<PedidoRepository>;
  let useCase: CriarPedidoUseCase;

  const carrinho = new Carrinho([new ItemPrecificado('produto-1', 'Detergente', 2, 10)]);

  beforeEach(() => {
    montarCarrinhoUseCase = {
      executar: jest.fn().mockResolvedValue(carrinho),
    } as unknown as jest.Mocked<MontarCarrinhoUseCase>;

    pedidoRepository = {
      criar: jest
        .fn()
        .mockResolvedValue(
          new Pedido('pedido-1', StatusPedido.CRIADO, [], 20, new Date(), new Date()),
        ),
      buscarPorId: jest.fn(),
      atualizarStatus: jest.fn(),
    } as unknown as jest.Mocked<PedidoRepository>;

    useCase = new CriarPedidoUseCase(montarCarrinhoUseCase, pedidoRepository);
  });

  it('não cria o pedido quando o carrinho é inválido (ex: vazio)', async () => {
    montarCarrinhoUseCase.executar.mockRejectedValue(new CarrinhoVazioException());

    await expect(useCase.executar([])).rejects.toBeInstanceOf(CarrinhoVazioException);
    expect(pedidoRepository.criar).not.toHaveBeenCalled();
  });

  it('persiste o pedido com os itens e o total calculados pelo carrinho (canal padrão: site)', async () => {
    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }]);

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [{ produtoId: 'produto-1', nome: 'Detergente', quantidade: 2, precoUnitario: 10 }],
      carrinho.total,
      undefined,
    );
  });

  it('registra o pedido em AGUARDANDO_CONTATO quando o canal é whatsapp', async () => {
    await useCase.executar([{ produtoId: 'produto-1', quantidade: 2 }], 'whatsapp');

    expect(pedidoRepository.criar).toHaveBeenCalledWith(
      [{ produtoId: 'produto-1', nome: 'Detergente', quantidade: 2, precoUnitario: 10 }],
      carrinho.total,
      StatusPedido.AGUARDANDO_CONTATO,
    );
  });
});
