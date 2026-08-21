import { DomainException } from '../../shared/exceptions/domain.exception';

export class PedidoNaoEncontradoException extends DomainException {
  readonly code = 'PEDIDO_NAO_ENCONTRADO';

  constructor(id: string) {
    super(`Pedido ${id} não encontrado.`);
  }
}

export class PedidoEmStatusInvalidoException extends DomainException {
  readonly code = 'PEDIDO_EM_STATUS_INVALIDO';

  constructor(mensagem: string) {
    super(mensagem);
  }
}
