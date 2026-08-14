// Exceções de domínio do carrinho de compras.
import { DomainException } from '../../shared/exceptions/domain.exception';

export class CarrinhoVazioException extends DomainException {
  readonly code = 'CARRINHO_VAZIO';

  constructor() {
    super('O carrinho precisa ter ao menos um item.');
  }
}

export class EstoqueInsuficienteException extends DomainException {
  readonly code = 'ESTOQUE_INSUFICIENTE';

  constructor(produtoNome: string) {
    super(`Estoque insuficiente para o produto "${produtoNome}".`);
  }
}
