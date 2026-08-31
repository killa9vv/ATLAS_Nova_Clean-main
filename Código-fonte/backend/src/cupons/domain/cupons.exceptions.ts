import { DomainException } from '../../shared/exceptions/domain.exception';

export class CupomNaoEncontradoException extends DomainException {
  readonly code = 'CUPOM_NAO_ENCONTRADO';

  constructor(id: string) {
    super(`Cupom ${id} não encontrado.`);
  }
}

export class CupomCodigoDuplicadoException extends DomainException {
  readonly code = 'CUPOM_CODIGO_DUPLICADO';

  constructor(codigo: string) {
    super(`Já existe um cupom com o código "${codigo}".`);
  }
}
