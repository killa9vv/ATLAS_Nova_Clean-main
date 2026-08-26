import { DomainException } from '../../shared/exceptions/domain.exception';

export class PagamentoNaoEncontradoException extends DomainException {
  readonly code = 'PAGAMENTO_NAO_ENCONTRADO';

  constructor(identificador: string) {
    super(`Pagamento ${identificador} não encontrado.`);
  }
}

export class PagamentoRecusadoException extends DomainException {
  readonly code = 'PAGAMENTO_RECUSADO';

  constructor(motivo: string) {
    super(`Pagamento recusado pelo gateway: ${motivo}`);
  }
}

export class PagamentoDuplicadoException extends DomainException {
  readonly code = 'PAGAMENTO_DUPLICADO';

  constructor(pedidoId: string) {
    super(`Já existe um pagamento aprovado para o pedido ${pedidoId}.`);
  }
}

/** Timeout, falha de rede ou erro 5xx do gateway — infraestrutura fora do ar. */
export class GatewayIndisponivelException extends DomainException {
  readonly code = 'GATEWAY_INDISPONIVEL';

  constructor(causa?: string) {
    super(`Gateway de pagamento indisponível${causa ? `: ${causa}` : '.'}`);
  }
}

/** Chave de API ausente, expirada ou rejeitada (401) pelo gateway. */
export class CredenciaisInvalidasGatewayException extends DomainException {
  readonly code = 'CREDENCIAIS_GATEWAY_INVALIDAS';

  constructor(detalhe?: string) {
    super(
      `Credenciais do gateway de pagamento inválidas ou não configuradas.${detalhe ? ` (${detalhe})` : ''}`,
    );
  }
}
