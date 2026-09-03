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

/** Timeout/erro de rede consultando o ViaCEP — diferente de CEP com formato inválido. */
export class CepIndisponivelException extends DomainException {
  readonly code = 'CEP_INDISPONIVEL';

  constructor() {
    super('Não foi possível consultar o CEP no momento. Tente novamente.');
  }
}

/** E-mail não cadastrado, senha errada, ou conta sem senha (só existe do checkout de
 * convidado, nunca "criou conta") — mesma mensagem genérica nos três casos, de
 * propósito, pra não revelar qual deles é o motivo real. */
export class CredenciaisInvalidasException extends DomainException {
  readonly code = 'CREDENCIAIS_INVALIDAS';

  constructor() {
    super('E-mail ou senha inválidos.');
  }
}

/** Token de recuperação de senha inexistente, expirado ou já usado — mesma mensagem
 * genérica nos três casos, mesmo motivo de CredenciaisInvalidasException. */
export class TokenRecuperacaoInvalidoException extends DomainException {
  readonly code = 'TOKEN_RECUPERACAO_INVALIDO';

  constructor() {
    super('Token de recuperação inválido ou expirado.');
  }
}

export class EnderecoPadraoUnicoException extends DomainException {
  readonly code = 'ENDERECO_PADRAO_UNICO';

  constructor() {
    super('Não é possível excluir o único endereço cadastrado.');
  }
}
