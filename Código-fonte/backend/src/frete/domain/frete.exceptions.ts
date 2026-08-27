import { DomainException } from '../../shared/exceptions/domain.exception';

export class CepInvalidoException extends DomainException {
  readonly code = 'CEP_INVALIDO';

  constructor(cep: string) {
    super(`CEP "${cep}" é inválido.`);
  }
}
