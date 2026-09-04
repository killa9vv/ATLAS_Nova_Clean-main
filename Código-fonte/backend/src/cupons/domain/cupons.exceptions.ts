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

/** Cupom existe mas não pode ser aplicado agora — inativo, expirado, ou usoMaximo atingido.
 * Mesma mensagem genérica pros três casos: não revela pro cliente qual deles é o motivo real
 * (mesmo padrão de CredenciaisInvalidasException em clientes). */
export class CupomInvalidoException extends DomainException {
  readonly code = 'CUPOM_INVALIDO';

  constructor(codigo: string) {
    super(`Cupom "${codigo}" não é válido ou expirou.`);
  }
}
