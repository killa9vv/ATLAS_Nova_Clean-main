import { Injectable } from '@nestjs/common';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { TransactionManager } from '../../shared/prisma/transaction-manager';
import { Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { StatusPedido } from '../domain/status-pedido.enum';
import {
  PedidoEmStatusInvalidoException,
  PedidoNaoEncontradoException,
} from '../domain/pedidos.exceptions';

/**
 * Transições que o admin pode disparar manualmente (ver PedidosController) e o que cada
 * uma faz com o estoque — mesma invariante do fluxo automático de pagamento
 * (ReconciliarPedidoService): estoque só é decrementado ao entrar em PAGO, e só é
 * devolvido ao sair de PAGO. Fora dessas transições listadas, tudo é rejeitado.
 *
 * Deliberadamente NÃO permitido: marcar CRIADO/AGUARDANDO_PAGAMENTO como PAGO na mão —
 * esses dois têm um pagamento online em andamento (Mercado Pago); só o
 * webhook/ReconciliarPedidoService deve confirmá-los, senão o admin estaria fingindo um
 * pagamento que pode nunca ter existido. AGUARDANDO_CONTATO → PAGO é o único caminho
 * manual pra PAGO porque esse canal (WhatsApp) nunca teve pagamento online pra começar —
 * é o staff confirmando que recebeu (Pix/dinheiro) fora do sistema.
 */
const TRANSICOES_PERMITIDAS: Record<StatusPedido, StatusPedido[]> = {
  [StatusPedido.CRIADO]: [StatusPedido.CANCELADO],
  [StatusPedido.AGUARDANDO_PAGAMENTO]: [StatusPedido.CANCELADO],
  [StatusPedido.AGUARDANDO_CONTATO]: [StatusPedido.CANCELADO, StatusPedido.PAGO],
  [StatusPedido.PAGO]: [StatusPedido.CANCELADO, StatusPedido.ESTORNADO],
  [StatusPedido.CANCELADO]: [],
  [StatusPedido.ESTORNADO]: [],
};

@Injectable()
export class AtualizarStatusPedidoUseCase {
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

    const permitidas = TRANSICOES_PERMITIDAS[pedido.status];
    if (!permitidas.includes(novoStatus)) {
      throw new PedidoEmStatusInvalidoException(
        `Pedido ${id} está ${pedido.status} — não é possível mudar pra ${novoStatus} manualmente.`,
      );
    }

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

    const precisaDevolverEstoque = pedido.status === StatusPedido.PAGO;
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
