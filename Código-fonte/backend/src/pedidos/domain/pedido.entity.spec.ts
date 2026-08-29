import { Pedido } from './pedido.entity';
import { StatusPedido } from './status-pedido.enum';

function criarPedido(status: StatusPedido): Pedido {
  return new Pedido('pedido-1', status, [], 100, 'RETIRADA', 0, new Date(), new Date());
}

describe('Pedido.estaAguardandoPagamento', () => {
  it('é true para CRIADO e AGUARDANDO_PAGAMENTO', () => {
    expect(criarPedido(StatusPedido.CRIADO).estaAguardandoPagamento()).toBe(true);
    expect(criarPedido(StatusPedido.AGUARDANDO_PAGAMENTO).estaAguardandoPagamento()).toBe(true);
  });

  it('é false para PAGO, CANCELADO e ESTORNADO', () => {
    expect(criarPedido(StatusPedido.PAGO).estaAguardandoPagamento()).toBe(false);
    expect(criarPedido(StatusPedido.CANCELADO).estaAguardandoPagamento()).toBe(false);
    expect(criarPedido(StatusPedido.ESTORNADO).estaAguardandoPagamento()).toBe(false);
  });
});
