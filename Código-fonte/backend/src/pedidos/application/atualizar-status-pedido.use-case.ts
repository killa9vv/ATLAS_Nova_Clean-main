import { Injectable } from '@nestjs/common';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { TransactionManager } from '../../shared/prisma/transaction-manager';
import { Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { OrigemTransicaoPedido, PedidoStateMachine } from '../domain/pedido-state-machine';
import { StatusPedido } from '../domain/status-pedido.enum';
import { PedidoNaoEncontradoException } from '../domain/pedidos.exceptions';

/** Transições que saem de PAGO devolvendo o estoque decrementado na confirmação do
 * pagamento — só as duas que efetivamente desfazem a venda. PAGO → SEPARACAO (início
 * da esteira de cumprimento) NÃO devolve: o pedido continua vendido, só mudou de fase. */
const STATUS_DEVOLVEM_ESTOQUE_DE_PAGO: ReadonlySet<StatusPedido> = new Set([
  StatusPedido.CANCELADO,
  StatusPedido.ESTORNADO,
]);

@Injectable()
export class AtualizarStatusPedidoUseCase {
  private readonly stateMachine = new PedidoStateMachine();

  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly transactionManager: TransactionManager,
  ) {}

  async executar(id: string, novoStatus: StatusPedido): Promise<Pedido> {
    const pedido = await this.pedidoRepository.buscarPorId(id);
    if (!pedido) {
      throw new PedidoNaoEncontradoException(id);
    }

    this.stateMachine.validar(pedido.status, novoStatus, OrigemTransicaoPedido.ADMIN);

    if (novoStatus === StatusPedido.PAGO) {
      // Mesma transação atômica do confirmarPagamento em ReconciliarPedidoService: se o
      // decremento falhar por falta de estoque, EstoqueInsuficienteException sobe pro
      // controller (409) e o pedido continua como estava — não fica "meio confirmado".
      return this.transactionManager.executar(async (contexto) => {
        await this.produtoRepository.decrementarEstoque(
          pedido.itens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
          })),
          contexto,
        );
        return this.pedidoRepository.atualizarStatus(id, novoStatus, contexto);
      });
    }

    const precisaDevolverEstoque =
      pedido.status === StatusPedido.PAGO && STATUS_DEVOLVEM_ESTOQUE_DE_PAGO.has(novoStatus);

    if (!precisaDevolverEstoque) {
      return this.pedidoRepository.atualizarStatus(id, novoStatus);
    }

    return this.transactionManager.executar(async (contexto) => {
      const atualizado = await this.pedidoRepository.atualizarStatus(id, novoStatus, contexto);
      await this.produtoRepository.incrementarEstoque(
        pedido.itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
        contexto,
      );
      return atualizado;
    });
  }
}
