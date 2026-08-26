import {
  PedidoEmStatusInvalidoException,
  PedidoNaoEncontradoException,
} from './pedidos.exceptions';

describe('PedidoNaoEncontradoException', () => {
  it('monta o código e a mensagem a partir do id', () => {
    const erro = new PedidoNaoEncontradoException('pedido-1');
    expect(erro.code).toBe('PEDIDO_NAO_ENCONTRADO');
    expect(erro.message).toBe('Pedido pedido-1 não encontrado.');
  });
});

describe('PedidoEmStatusInvalidoException', () => {
  it('monta o código e preserva a mensagem recebida', () => {
    const erro = new PedidoEmStatusInvalidoException('Pedido já está pago.');
    expect(erro.code).toBe('PEDIDO_EM_STATUS_INVALIDO');
    expect(erro.message).toBe('Pedido já está pago.');
  });
});
