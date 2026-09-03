import { OrigemTransicaoPedido, PedidoStateMachine } from './pedido-state-machine';
import { StatusPedido } from './status-pedido.enum';
import { PedidoEmStatusInvalidoException } from './pedidos.exceptions';

const { ADMIN, SISTEMA_PAGAMENTO } = OrigemTransicaoPedido;

describe('PedidoStateMachine', () => {
  let stateMachine: PedidoStateMachine;

  beforeEach(() => {
    stateMachine = new PedidoStateMachine();
  });

  describe('transições válidas', () => {
    it.each([
      [StatusPedido.CRIADO, StatusPedido.PAGO, SISTEMA_PAGAMENTO],
      [StatusPedido.CRIADO, StatusPedido.CANCELADO, ADMIN],
      [StatusPedido.CRIADO, StatusPedido.CANCELADO, SISTEMA_PAGAMENTO],
      [StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.PAGO, SISTEMA_PAGAMENTO],
      [StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.CANCELADO, ADMIN],
      [StatusPedido.AGUARDANDO_CONTATO, StatusPedido.PAGO, ADMIN],
      [StatusPedido.AGUARDANDO_CONTATO, StatusPedido.CANCELADO, ADMIN],
      [StatusPedido.PAGO, StatusPedido.SEPARACAO, ADMIN],
      [StatusPedido.PAGO, StatusPedido.CANCELADO, ADMIN],
      [StatusPedido.PAGO, StatusPedido.ESTORNADO, ADMIN],
      [StatusPedido.PAGO, StatusPedido.ESTORNADO, SISTEMA_PAGAMENTO],
      [StatusPedido.SEPARACAO, StatusPedido.ENVIADO, ADMIN],
      [StatusPedido.ENVIADO, StatusPedido.ENTREGUE, ADMIN],
    ])('permite %s → %s (origem: %s)', (de, para, origem) => {
      expect(() => stateMachine.validar(de, para, origem)).not.toThrow();
    });
  });

  describe('transições inválidas', () => {
    it.each([
      // Nunca confirmar pagamento online na mão — só o sistema de pagamento confirma.
      [StatusPedido.CRIADO, StatusPedido.PAGO, ADMIN],
      [StatusPedido.AGUARDANDO_PAGAMENTO, StatusPedido.PAGO, ADMIN],
      // Canal WhatsApp nunca tem pagamento online — sistema de pagamento não confirma.
      [StatusPedido.AGUARDANDO_CONTATO, StatusPedido.PAGO, SISTEMA_PAGAMENTO],
      // Não pode pular etapa da esteira de cumprimento.
      [StatusPedido.PAGO, StatusPedido.ENVIADO, ADMIN],
      [StatusPedido.PAGO, StatusPedido.ENTREGUE, ADMIN],
      [StatusPedido.SEPARACAO, StatusPedido.ENTREGUE, ADMIN],
      // Sem cancelamento depois que entrou na esteira de cumprimento.
      [StatusPedido.SEPARACAO, StatusPedido.CANCELADO, ADMIN],
      [StatusPedido.ENVIADO, StatusPedido.CANCELADO, ADMIN],
      [StatusPedido.ENTREGUE, StatusPedido.CANCELADO, ADMIN],
      // Sistema de pagamento não cancela um pedido já pago (só admin, ou estorno).
      [StatusPedido.PAGO, StatusPedido.CANCELADO, SISTEMA_PAGAMENTO],
      // Estados finais não saem pra lugar nenhum.
      [StatusPedido.ENTREGUE, StatusPedido.PAGO, ADMIN],
      [StatusPedido.CANCELADO, StatusPedido.PAGO, ADMIN],
      [StatusPedido.ESTORNADO, StatusPedido.PAGO, ADMIN],
      // Regressão dentro da esteira.
      [StatusPedido.ENVIADO, StatusPedido.SEPARACAO, ADMIN],
    ])('rejeita %s → %s (origem: %s)', (de, para, origem) => {
      expect(() => stateMachine.validar(de, para, origem)).toThrow(PedidoEmStatusInvalidoException);
    });
  });

  describe('transicoesPermitidas', () => {
    it('lista só os destinos que ADMIN pode disparar a partir de CRIADO (sem PAGO)', () => {
      expect(stateMachine.transicoesPermitidas(StatusPedido.CRIADO, ADMIN)).toEqual([
        StatusPedido.CANCELADO,
      ]);
    });

    it('lista os destinos da esteira de cumprimento a partir de PAGO', () => {
      expect(stateMachine.transicoesPermitidas(StatusPedido.PAGO, ADMIN)).toEqual([
        StatusPedido.SEPARACAO,
        StatusPedido.CANCELADO,
        StatusPedido.ESTORNADO,
      ]);
    });

    it('não lista nada a partir de um status final', () => {
      expect(stateMachine.transicoesPermitidas(StatusPedido.ENTREGUE, ADMIN)).toEqual([]);
      expect(stateMachine.transicoesPermitidas(StatusPedido.CANCELADO, ADMIN)).toEqual([]);
    });
  });
});
