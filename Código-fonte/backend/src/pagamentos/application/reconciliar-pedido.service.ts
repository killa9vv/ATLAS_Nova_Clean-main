import { Injectable, Logger } from '@nestjs/common';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';
import { ProdutoRepository } from '../../produtos/domain/produto.repository';
import { CupomRepository } from '../../cupons/domain/cupom.repository';
import { CupomEsgotadoException } from '../../cupons/domain/cupons.exceptions';
import { PedidoRepository } from '../../pedidos/domain/pedido.repository';
import { Pedido } from '../../pedidos/domain/pedido.entity';
import {
  OrigemTransicaoPedido,
  PedidoStateMachine,
} from '../../pedidos/domain/pedido-state-machine';
import { StatusPedido } from '../../pedidos/domain/status-pedido.enum';
import { PedidoEmStatusInvalidoException } from '../../pedidos/domain/pedidos.exceptions';
import { EmailQueuePort } from '../../emails/domain/email-queue.port';
import { TransactionManager } from '../../shared/prisma/transaction-manager';
import { Pagamento } from '../domain/pagamento.entity';
import { StatusPagamento } from '../domain/status-pagamento.enum';

// Pagamento que falhou (RECUSADO/EXPIRADO/CANCELADO) de propósito NÃO cancela o
// pedido: um pedido pode ter várias tentativas (cartão recusado → tenta outro
// cartão; Pix gerado duas vezes), e cancelar na primeira falha impedia a nova
// tentativa — ou cancelava um pedido cujo segundo Pix foi pago. Pedido que fica sem
// nenhuma tentativa viva é cancelado depois por CancelarPedidosAbandonadosUseCase.
const STATUS_PAGAMENTO_PARA_PEDIDO: Partial<Record<StatusPagamento, StatusPedido>> = {
  [StatusPagamento.APROVADO]: StatusPedido.PAGO,
  [StatusPagamento.ESTORNADO]: StatusPedido.ESTORNADO,
};

/**
 * Aplica o efeito de um status de pagamento sobre o pedido correspondente (baixa de
 * estoque, marcação como PAGO/CANCELADO/ESTORNADO). Compartilhado por
 * ProcessarWebhookUseCase (quando o status muda via notificação assíncrona) e
 * CriarPagamentoUseCase (quando o gateway já resolve o pagamento de forma síncrona,
 * ex.: cartão aprovado/recusado na hora — nesse caso não existe uma notificação de
 * webhook posterior "mudando" o status pra disparar essa mesma reconciliação).
 */
@Injectable()
export class ReconciliarPedidoService {
  private readonly logger = new Logger(ReconciliarPedidoService.name);
  private readonly stateMachine = new PedidoStateMachine();

  constructor(
    private readonly pedidoRepository: PedidoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly cupomRepository: CupomRepository,
    private readonly transactionManager: TransactionManager,
    private readonly emailQueue: EmailQueuePort,
  ) {}

  async executar(pagamento: Pagamento): Promise<void> {
    const novoStatusPedido = STATUS_PAGAMENTO_PARA_PEDIDO[pagamento.status];
    if (!novoStatusPedido) {
      return;
    }

    const pedido = await this.pedidoRepository.buscarPorId(pagamento.pedidoId);
    if (!pedido) {
      this.logger.warn(
        `Pagamento ${pagamento.id} referencia pedido ${pagamento.pedidoId}, que não foi encontrado.`,
      );
      return;
    }

    if (pedido.status === novoStatusPedido) {
      return;
    }

    try {
      this.stateMachine.validar(
        pedido.status,
        novoStatusPedido,
        OrigemTransicaoPedido.SISTEMA_PAGAMENTO,
      );
    } catch (erro) {
      if (!(erro instanceof PedidoEmStatusInvalidoException)) {
        throw erro;
      }
      this.logger.warn(
        `Inconsistência detectada: pagamento ${pagamento.id} está ${pagamento.status} ` +
          `(sugere pedido ${novoStatusPedido}), mas pedido ${pedido.id} está em ${pedido.status}. ` +
          'Requer reconciliação manual.',
      );
      return;
    }

    if (novoStatusPedido === StatusPedido.PAGO) {
      await this.confirmarPagamento(pedido, pagamento);
      return;
    }

    // O estoque só foi decrementado se o pedido chegou a ser marcado como PAGO (ver
    // confirmarPagamento) — a criação do pedido em si não reserva nada. Cancelar um
    // pedido que nunca chegou a ser pago não tem o que devolver.
    const estoqueHaviaSidoReservado = pedido.status === StatusPedido.PAGO;

    if (!estoqueHaviaSidoReservado) {
      await this.pedidoRepository.atualizarStatus(pedido.id, novoStatusPedido);
      return;
    }

    // Mesma exigência de atomicidade do confirmarPagamento: se o processo cair entre
    // marcar o pedido e devolver o estoque, não pode sobrar um CANCELADO/ESTORNADO sem
    // a devolução correspondente.
    await this.transactionManager.executar(async (contexto) => {
      await this.pedidoRepository.atualizarStatus(pedido.id, novoStatusPedido, contexto);
      await this.produtoRepository.incrementarEstoque(
        pedido.itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
        contexto,
      );
      if (pedido.cupomCodigo) {
        await this.cupomRepository.decrementarUsos(pedido.cupomCodigo, contexto);
        if (pedido.clienteId) {
          await this.cupomRepository.decrementarUsoCliente(
            pedido.cupomCodigo,
            pedido.clienteId,
            contexto,
          );
        }
      }
    });
  }

  /**
   * Decrementa o estoque dos itens do pedido e marca o pedido como PAGO na mesma
   * transação — é aqui, na confirmação do pagamento (não no checkout), que o estoque é
   * de fato reservado (ver decisão documentada no README raiz). Entre o checkout e a
   * aprovação do pagamento o item pode ter sido vendido por outro pedido que pagou
   * primeiro; nesse caso o decremento falha e NÃO marcamos o pedido como PAGO — o
   * pagamento já foi capturado pelo gateway, então isso vira uma anomalia que precisa
   * de intervenção humana (normalmente estornar o cliente), não um erro para o
   * Mercado Pago reentregar via retry.
   */
  private async confirmarPagamento(pedido: Pedido, pagamento: Pagamento): Promise<void> {
    try {
      await this.transactionManager.executar(async (contexto) => {
        await this.produtoRepository.decrementarEstoque(
          pedido.itens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
          })),
          contexto,
        );
        if (pedido.cupomCodigo) {
          // Ordem importa: o guard atômico contra usoMaximo está em incrementarUsos
          // (updateMany condicional) — se ele lançar CupomEsgotadoException, o
          // incrementarUsoCliente abaixo nunca roda, e o rollback da transação desfaz
          // o decremento de estoque já feito acima.
          await this.cupomRepository.incrementarUsos(pedido.cupomCodigo, contexto);
          if (pedido.clienteId) {
            await this.cupomRepository.incrementarUsoCliente(
              pedido.cupomCodigo,
              pedido.clienteId,
              contexto,
            );
          }
        }
        await this.pedidoRepository.atualizarStatus(pedido.id, StatusPedido.PAGO, contexto);
      });
      // Só dispara depois da transação commitar de verdade — nunca de dentro dela (ver
      // EmailQueuePort: enfileirar nunca lança, então isso não pode reabrir o try/catch
      // do decremento de estoque acima).
      await this.emailQueue.enfileirar({ tipo: 'PAGAMENTO_APROVADO', pedidoId: pedido.id });
    } catch (erro) {
      if (erro instanceof EstoqueInsuficienteException) {
        this.logger.error(
          `Pagamento ${pagamento.id} do pedido ${pedido.id} foi aprovado pelo gateway, mas o estoque ` +
            `não está mais disponível (${erro.message}). O pedido NÃO foi marcado como PAGO. ` +
            'Requer reconciliação manual — provavelmente estornar o cliente.',
        );
        return;
      }
      if (erro instanceof CupomEsgotadoException) {
        // Mesma anomalia do estoque insuficiente acima: o pagamento (já com o
        // desconto aplicado) foi capturado pelo gateway antes de outra confirmação
        // simultânea esgotar o cupom por último. Não marca como PAGO — decidir
        // manualmente (normalmente: honrar o desconto mesmo assim, ou estornar).
        this.logger.error(
          `Pagamento ${pagamento.id} do pedido ${pedido.id} foi aprovado pelo gateway, mas o cupom ` +
            `"${pedido.cupomCodigo}" esgotou nesse meio tempo. O pedido NÃO foi marcado como PAGO. ` +
            'Requer reconciliação manual.',
        );
        return;
      }
      throw erro;
    }
  }
}
