import { Injectable } from '@nestjs/common';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoItemSolicitado } from '../../carrinho/domain/carrinho-item-solicitado';
import { CalcularFreteUseCase } from '../../frete/application/calcular-frete.use-case';
import { ShippingAllocator } from '../../frete/domain/shipping-allocator';
import { ClienteRepository } from '../../clientes/domain/cliente.repository';
import { ClienteNaoEncontradoException } from '../../clientes/domain/clientes.exceptions';
import { PedidoRepository } from '../domain/pedido.repository';
import {
  ContatoPedido,
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

// Peso usado no rateio quando o produto não tem pesoKg cadastrado (catálogo legado,
// coluna opcional) — mesmo piso mínimo usado pelo MelhorEnvioShippingQuoteProvider,
// só pra o rateio nunca dividir pelo peso total zero.
const PESO_PADRAO_RATEIO_KG = 0.3;

@Injectable()
export class CriarPedidoUseCase {
  private readonly shippingAllocator = new ShippingAllocator();

  constructor(
    private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase,
    private readonly calcularFreteUseCase: CalcularFreteUseCase,
    private readonly pedidoRepository: PedidoRepository,
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async executar(
    itensSolicitados: CarrinhoItemSolicitado[],
    entregaSolicitada: EntregaSolicitada,
    contato: ContatoPedido,
    clienteId?: string,
    canal: CanalCheckout = 'site',
  ): Promise<Pedido> {
    // Fail-fast: valida o cliente antes de montar o carrinho, pra não gastar uma
    // consulta de estoque/preço num pedido que vai falhar de qualquer jeito.
    if (clienteId && !(await this.clienteRepository.buscarPorId(clienteId))) {
      throw new ClienteNaoEncontradoException(clienteId);
    }

    const carrinho = await this.montarCarrinhoUseCase.executar(itensSolicitados);

    // RETIRADA nunca cobra frete nem rateia nada entre os itens. ENTREGA usa a mesma
    // cotação do endpoint público de frete (POST /frete/cotacao) — reaproveitada aqui
    // pra não duplicar a regra de frete grátis (FRETE_GRATIS_ACIMA_DE) nem a decisão
    // API-vs-tabela regional — e depois rateia o valor obtido entre os itens,
    // proporcional ao peso (dados físicos reais do produto quando cadastrados; ver
    // ShippingAllocator/PESO_PADRAO_RATEIO_KG pro fallback quando não estão).
    let valorFrete = 0;
    let fretePorProduto = new Map<string, number>();

    if (entregaSolicitada.tipoEntrega === 'ENTREGA') {
      const cotacao = await this.calcularFreteUseCase.executar({
        cepDestino: entregaSolicitada.endereco!.cep,
        quantidadeItens: carrinho.itens.reduce((soma, item) => soma + item.quantidade, 0),
        valorDeclarado: carrinho.total,
        itens: carrinho.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          pesoKg: item.pesoKg,
          alturaCm: item.alturaCm,
          larguraCm: item.larguraCm,
          comprimentoCm: item.comprimentoCm,
        })),
      });
      valorFrete = cotacao.opcoes.find((opcao) => opcao.tipo === 'ENTREGA')!.valor;

      const rateio = this.shippingAllocator.ratearPorPeso(
        valorFrete,
        carrinho.itens.map((item) => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          pesoKg: item.pesoKg ?? PESO_PADRAO_RATEIO_KG,
        })),
      );
      fretePorProduto = new Map(rateio.map((item) => [item.produtoId, item.freteRateado]));
    }

    const itens = carrinho.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      freteRateado: fretePorProduto.get(item.produtoId) ?? 0,
    }));

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

    return this.pedidoRepository.criar(
      itens,
      carrinho.total + valorFrete,
      entrega,
      contato,
      clienteId,
      statusInicial,
    );
  }
}
