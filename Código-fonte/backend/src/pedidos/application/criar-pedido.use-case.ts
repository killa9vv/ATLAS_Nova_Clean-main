import { Injectable } from '@nestjs/common';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoItemSolicitado } from '../../carrinho/domain/carrinho-item-solicitado';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';

export type CanalCheckout = 'site' | 'whatsapp';

@Injectable()
export class CriarPedidoUseCase {
  constructor(
    private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase,
    private readonly pedidoRepository: PedidoRepository,
  ) {}

  async executar(
    itensSolicitados: CarrinhoItemSolicitado[],
    canal: CanalCheckout = 'site',
  ): Promise<Pedido> {
    const carrinho = await this.montarCarrinhoUseCase.executar(itensSolicitados);

    const itens = carrinho.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
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

    return this.pedidoRepository.criar(itens, carrinho.total, statusInicial);
  }
}
