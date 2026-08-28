import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoItemSolicitado } from '../../carrinho/domain/carrinho-item-solicitado';
import { ShippingService } from '../../shipping/domain/shipping.service';
import { ShippingAllocator } from '../../shipping/domain/shipping-allocator';
import { ShippingItem } from '../../shipping/domain/shipping.types';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';

export type CanalCheckout = 'site' | 'whatsapp';

@Injectable()
export class CriarPedidoUseCase {
  private readonly shippingAllocator = new ShippingAllocator();

  constructor(
    private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase,
    private readonly pedidoRepository: PedidoRepository,
    private readonly shippingService: ShippingService,
    private readonly configService: ConfigService,
  ) {}

  async executar(
    itensSolicitados: CarrinhoItemSolicitado[],
    canal: CanalCheckout = 'site',
    cepDestino?: string,
  ): Promise<Pedido> {
    const carrinho = await this.montarCarrinhoUseCase.executar(itensSolicitados);

    if (!cepDestino) {
      throw new Error('CEP de destino é obrigatório.');
    }

    const cepOrigem = this.configService.get<string>('CEP_ORIGEM');

    if (!cepOrigem) {
      throw new Error('CEP_ORIGEM não configurado.');
    }

    const shippingItems: ShippingItem[] = carrinho.itens.map((item) => {
      if (
        item.pesoKg === undefined ||
        item.alturaCm === undefined ||
        item.larguraCm === undefined ||
        item.comprimentoCm === undefined
      ) {
        throw new Error(
          `Produto ${item.produtoId} não possui dados físicos para cálculo de frete.`,
        );
      }

      return {
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        pesoKg: item.pesoKg,
        alturaCm: item.alturaCm,
        larguraCm: item.larguraCm,
        comprimentoCm: item.comprimentoCm,
        valorUnitario: item.precoUnitario,
      };
    });

    const cotacao = await this.shippingService.cotar(cepOrigem, cepDestino, shippingItems);

    const rateio = this.shippingAllocator.ratearPorPeso(
      cotacao.valor,
      shippingItems.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        pesoKg: item.pesoKg,
      })),
    );

    const fretePorProduto = new Map(rateio.map((item) => [item.produtoId, item.freteRateado]));

    const itens = carrinho.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      freteRateado: fretePorProduto.get(item.produtoId) ?? 0,
    }));

    // montarCarrinho já validou o estoque numa leitura simples (fail-fast pra UX, e pra não
    // deixar o cliente preencher pagamento pra um item indisponível). Isso NÃO reserva
    // estoque: o decremento de verdade só acontece na confirmação do pagamento
    // (ProcessarWebhookUseCase, ao marcar o pedido como PAGO) — ver decisão documentada
    // no README raiz. Por isso a criação do pedido aqui é uma escrita só, sem precisar de
    // uma transação envolvendo mais de um repositório.
    //
    // Checkout via WhatsApp não passa pelo pagamento online — registra o pedido direto em
    // AGUARDANDO_CONTATO, pra existir um registro no banco antes do redirect pro wa.me.
    const statusInicial = canal === 'whatsapp' ? StatusPedido.AGUARDANDO_CONTATO : undefined;

    return this.pedidoRepository.criar(
      itens,
      carrinho.total,
      statusInicial,
      undefined,
      cotacao.valor,
    );
  }
}
