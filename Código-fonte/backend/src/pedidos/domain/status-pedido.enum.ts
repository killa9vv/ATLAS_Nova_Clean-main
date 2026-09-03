export enum StatusPedido {
  CRIADO = 'CRIADO',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
  /** Pedido feito via checkout do WhatsApp — a venda fecha na conversa, sem pagamento online. */
  AGUARDANDO_CONTATO = 'AGUARDANDO_CONTATO',
  PAGO = 'PAGO',
  /** Esteira de cumprimento pós-pagamento — ver PedidoStateMachine pras transições válidas. */
  SEPARACAO = 'SEPARACAO',
  ENVIADO = 'ENVIADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  ESTORNADO = 'ESTORNADO',
}
