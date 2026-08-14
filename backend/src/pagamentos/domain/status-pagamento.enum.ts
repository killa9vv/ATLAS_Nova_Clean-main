// Status possíveis de um pagamento no domínio (independente do vocabulário do gateway).
export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  EM_PROCESSAMENTO = 'EM_PROCESSAMENTO',
  APROVADO = 'APROVADO',
  RECUSADO = 'RECUSADO',
  CANCELADO = 'CANCELADO',
  ESTORNADO = 'ESTORNADO',
  EXPIRADO = 'EXPIRADO',
}
