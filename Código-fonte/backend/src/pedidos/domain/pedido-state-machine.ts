import { StatusPedido } from './status-pedido.enum';
import { PedidoEmStatusInvalidoException } from './pedidos.exceptions';

/**
 * Quem está pedindo a transição — algumas só fazem sentido vindas de um lado.
 * ADMIN: staff disparando manualmente (PATCH /pedidos/:id/status).
 * SISTEMA_PAGAMENTO: confirmação automática via gateway (webhook do Mercado
 * Pago ou o polling de reconciliação) — ver ReconciliarPedidoService.
 */
export enum OrigemTransicaoPedido {
  ADMIN = 'ADMIN',
  SISTEMA_PAGAMENTO = 'SISTEMA_PAGAMENTO',
}

interface RegraTransicao {
  destino: StatusPedido;
  origens: OrigemTransicaoPedido[];
}

const { ADMIN, SISTEMA_PAGAMENTO } = OrigemTransicaoPedido;

/**
 * Única fonte de verdade de quais transições de Pedido.status são válidas e quem
 * pode disparar cada uma. Nenhum outro lugar do código deve decidir isso — tanto
 * AtualizarStatusPedidoUseCase (admin manual) quanto ReconciliarPedidoService
 * (automático via pagamento) delegam pra cá antes de chamar
 * PedidoRepository.atualizarStatus.
 *
 * Deliberadamente NÃO permitido: marcar CRIADO/AGUARDANDO_PAGAMENTO como PAGO na
 * mão — esses dois têm um pagamento online em andamento (Mercado Pago); só o
 * webhook/reconciliação deve confirmá-los, senão o admin estaria fingindo um
 * pagamento que pode nunca ter existido. AGUARDANDO_CONTATO → PAGO é o único
 * caminho manual pra PAGO porque esse canal (WhatsApp) nunca teve pagamento
 * online pra começar — é o staff confirmando que recebeu (Pix/dinheiro) fora do
 * sistema.
 *
 * A partir de PAGO entra a esteira de cumprimento (SEPARACAO → ENVIADO →
 * ENTREGUE), sempre disparada pelo admin. Cancelamento só é permitido até PAGO
 * (inclusive) — uma vez em SEPARACAO o pedido já foi fisicamente para
 * preparação, então virar CANCELADO deixa de ser uma transição de sistema e
 * passa a ser logística reversa tratada fora daqui.
 */
const TRANSICOES: Record<StatusPedido, RegraTransicao[]> = {
  [StatusPedido.CRIADO]: [
    { destino: StatusPedido.PAGO, origens: [SISTEMA_PAGAMENTO] },
    { destino: StatusPedido.CANCELADO, origens: [ADMIN, SISTEMA_PAGAMENTO] },
  ],
  [StatusPedido.AGUARDANDO_PAGAMENTO]: [
    { destino: StatusPedido.PAGO, origens: [SISTEMA_PAGAMENTO] },
    { destino: StatusPedido.CANCELADO, origens: [ADMIN, SISTEMA_PAGAMENTO] },
  ],
  [StatusPedido.AGUARDANDO_CONTATO]: [
    { destino: StatusPedido.PAGO, origens: [ADMIN] },
    { destino: StatusPedido.CANCELADO, origens: [ADMIN, SISTEMA_PAGAMENTO] },
  ],
  [StatusPedido.PAGO]: [
    { destino: StatusPedido.SEPARACAO, origens: [ADMIN] },
    { destino: StatusPedido.CANCELADO, origens: [ADMIN] },
    { destino: StatusPedido.ESTORNADO, origens: [ADMIN, SISTEMA_PAGAMENTO] },
  ],
  [StatusPedido.SEPARACAO]: [{ destino: StatusPedido.ENVIADO, origens: [ADMIN] }],
  [StatusPedido.ENVIADO]: [{ destino: StatusPedido.ENTREGUE, origens: [ADMIN] }],
  [StatusPedido.ENTREGUE]: [],
  [StatusPedido.CANCELADO]: [],
  [StatusPedido.ESTORNADO]: [],
};

export class PedidoStateMachine {
  /** Lança PedidoEmStatusInvalidoException se a transição não é permitida pra essa origem. */
  validar(
    statusAtual: StatusPedido,
    novoStatus: StatusPedido,
    origem: OrigemTransicaoPedido,
  ): void {
    const regra = TRANSICOES[statusAtual].find((r) => r.destino === novoStatus);

    if (!regra || !regra.origens.includes(origem)) {
      throw new PedidoEmStatusInvalidoException(
        `Pedido está ${statusAtual} — não é possível mudar pra ${novoStatus} (origem: ${origem}).`,
      );
    }
  }

  /** Transições que `origem` pode disparar a partir de `statusAtual` — usado pra documentar/expor na API, não pra validar (use `validar`). */
  transicoesPermitidas(statusAtual: StatusPedido, origem: OrigemTransicaoPedido): StatusPedido[] {
    return TRANSICOES[statusAtual].filter((r) => r.origens.includes(origem)).map((r) => r.destino);
  }
}
