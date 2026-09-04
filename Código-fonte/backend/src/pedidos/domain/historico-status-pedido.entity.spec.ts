import { HistoricoStatusPedido } from './historico-status-pedido.entity';
import { StatusPedido } from './status-pedido.enum';

describe('HistoricoStatusPedido', () => {
  it('guarda os dados de uma transição de status, incluindo o status anterior', () => {
    const alteradoEm = new Date('2026-09-03T12:00:00Z');

    const historico = new HistoricoStatusPedido(
      'historico-1',
      'pedido-1',
      StatusPedido.PAGO,
      alteradoEm,
      StatusPedido.AGUARDANDO_PAGAMENTO,
    );

    expect(historico).toMatchObject({
      id: 'historico-1',
      pedidoId: 'pedido-1',
      statusNovo: StatusPedido.PAGO,
      alteradoEm,
      statusAnterior: StatusPedido.AGUARDANDO_PAGAMENTO,
    });
  });

  it('permite status anterior indefinido (primeira entrada da timeline, pedido recém-criado)', () => {
    const historico = new HistoricoStatusPedido(
      'historico-1',
      'pedido-1',
      StatusPedido.CRIADO,
      new Date('2026-09-03T12:00:00Z'),
    );

    expect(historico.statusAnterior).toBeUndefined();
  });
});
