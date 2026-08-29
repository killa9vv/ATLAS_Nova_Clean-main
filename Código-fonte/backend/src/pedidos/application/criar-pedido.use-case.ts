import { Injectable } from '@nestjs/common';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoItemSolicitado } from '../../carrinho/domain/carrinho-item-solicitado';
import { CalcularFreteUseCase } from '../../frete/application/calcular-frete.use-case';
import { PedidoRepository } from '../domain/pedido.repository';
import {
  DadosEntregaPedido,
  EnderecoEntregaPedido,
  Pedido,
  TipoEntrega,
} from '../domain/pedido.entity';
import { StatusPedido } from '../domain/status-pedido.enum';

export type CanalCheckout = 'site' | 'whatsapp';

export interface EntregaSolicitada {
  tipoEntrega: TipoEntrega;
  /** Obrigatório (garantido pelo DTO) quando tipoEntrega é ENTREGA; ignorado em RETIRADA. */
  endereco?: EnderecoEntregaPedido;
}

@Injectable()
export class CriarPedidoUseCase {
  constructor(
    private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase,
    private readonly calcularFreteUseCase: CalcularFreteUseCase,
    private readonly pedidoRepository: PedidoRepository,
  ) {}

  async executar(
    itensSolicitados: CarrinhoItemSolicitado[],
    entregaSolicitada: EntregaSolicitada,
    canal: CanalCheckout = 'site',
  ): Promise<Pedido> {
    const carrinho = await this.montarCarrinhoUseCase.executar(itensSolicitados);

    const itens = carrinho.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    }));

    // RETIRADA nunca cobra frete. ENTREGA usa a mesma cotação do endpoint público
    // de frete (POST /frete/cotacao) — reaproveitada aqui pra não duplicar a regra
    // de frete grátis (FRETE_GRATIS_ACIMA_DE) nem a decisão API-vs-tabela regional.
    let valorFrete = 0;
    if (entregaSolicitada.tipoEntrega === 'ENTREGA') {
      const cotacao = await this.calcularFreteUseCase.executar({
        cepDestino: entregaSolicitada.endereco!.cep,
        quantidadeItens: carrinho.itens.reduce((soma, item) => soma + item.quantidade, 0),
        valorDeclarado: carrinho.total,
      });
      valorFrete = cotacao.opcoes.find((opcao) => opcao.tipo === 'ENTREGA')!.valor;
    }

    const entrega: DadosEntregaPedido = {
      tipoEntrega: entregaSolicitada.tipoEntrega,
      valorFrete,
      endereco:
        entregaSolicitada.tipoEntrega === 'ENTREGA' ? entregaSolicitada.endereco : undefined,
    };

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

    return this.pedidoRepository.criar(itens, carrinho.total + valorFrete, entrega, statusInicial);
  }
}
