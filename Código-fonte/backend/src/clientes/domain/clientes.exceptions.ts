import { DomainException } from '../../shared/exceptions/domain.exception';

export class ClienteNaoEncontradoException extends DomainException {
  readonly code = 'CLIENTE_NAO_ENCONTRADO';

  constructor(id: string) {
    super(`Cliente ${id} não encontrado.`);
  }
}

export class DocumentoInvalidoException extends DomainException {
  readonly code = 'DOCUMENTO_INVALIDO';

  constructor(mensagem: string) {
    super(mensagem);
  }
}

export class EnderecoNaoEncontradoException extends DomainException {
  readonly code = 'ENDERECO_NAO_ENCONTRADO';

  constructor(id: string) {
    super(`Endereço ${id} não encontrado.`);
  }
}

/** CEP com 8 dígitos mas fora do padrão esperado pela aplicação (ex.: todos zeros). */
export class CepInvalidoException extends DomainException {
  readonly code = 'CEP_INVALIDO';

  constructor(cep: string) {
    super(`CEP "${cep}" é inválido.`);
  }
}

/** ViaCEP respondeu, mas não tem esse CEP cadastrado — diferente de formato inválido. */
export class CepNaoEncontradoException extends DomainException {
  readonly code = 'CEP_NAO_ENCONTRADO';

  constructor(cep: string) {
    super(`CEP "${cep}" não foi encontrado.`);
  }
}
