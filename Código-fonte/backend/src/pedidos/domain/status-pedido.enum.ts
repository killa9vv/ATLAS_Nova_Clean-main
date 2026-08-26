export enum StatusPedido {
  CRIADO = 'CRIADO',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
  /** Pedido feito via checkout do WhatsApp — a venda fecha na conversa, sem pagamento online. */
  AGUARDANDO_CONTATO = 'AGUARDANDO_CONTATO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
  ESTORNADO = 'ESTORNADO',
}
