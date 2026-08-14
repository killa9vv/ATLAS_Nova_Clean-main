// Status possíveis de um pedido ao longo do seu ciclo de vida.
export enum StatusPedido {
  CRIADO = 'CRIADO',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
  ESTORNADO = 'ESTORNADO',
}
