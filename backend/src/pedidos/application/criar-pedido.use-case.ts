// Use case que cria um pedido a partir dos itens solicitados: monta o carrinho
// (validando estoque/preço), decrementa o estoque de forma atômica e persiste
// o pedido resultante.
import { Injectable } from '@nestjs/common';
import { MontarCarrinhoUseCase } from '../../carrinho/application/montar-carrinho.use-case';
import { CarrinhoItemSolicitado } from '../../carrinho/domain/carrinho-item-solicitado';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { PedidoRepository } from '../domain/pedido.repository';
import { Pedido } from '../domain/pedido.entity';

@Injectable()
export class CriarPedidoUseCase {
  constructor(
    private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase,
    private readonly produtoRepository: ProdutoRepository,
    private readonly pedidoRepository: PedidoRepository,
  ) {}

  async executar(itensSolicitados: CarrinhoItemSolicitado[]): Promise<Pedido> {
    const carrinho = await this.montarCarrinhoUseCase.executar(itensSolicitados);

    const itens = carrinho.itens.map((item) => ({
      produtoId: item.produtoId,
      nome: item.nome,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
    }));

    // A checagem em montarCarrinho já validou o estoque numa leitura simples (fail-fast
    // para UX); este decremento é quem garante a exclusão mútua de fato entre pedidos
    // concorrentes, via UPDATE condicional no banco.
    await this.produtoRepository.decrementarEstoque(itens);

    return this.pedidoRepository.criar(itens, carrinho.total);
  }
}
