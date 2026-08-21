import { DomainException } from '../../shared/exceptions/domain.exception';

export class ProdutoNaoEncontradoException extends DomainException {
  readonly code = 'PRODUTO_NAO_ENCONTRADO';

  constructor(id: string) {
    super(`Produto ${id} não encontrado.`);
  }
}
