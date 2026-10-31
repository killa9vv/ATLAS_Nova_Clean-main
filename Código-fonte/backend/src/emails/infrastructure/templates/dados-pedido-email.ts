/** Dado real do pedido pros templates — nunca texto genérico sem interpolar. */
export interface ItemPedidoEmail {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface DadosPedidoEmail {
  numero: string;
  nomeCliente: string;
  itens: ItemPedidoEmail[];
  total: number;
  /** Mostrados entre os itens e o total — sem eles, "1 item de R$ 14,90, total
   * R$ 59,90" parece cobrança errada pro cliente. 0 = linha omitida. */
  valorFrete: number;
  desconto: number;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  /** Só quando o pedido tem cliente logado — sem conta, não existe página de
   * acompanhamento pública no frontend ainda (o backend expõe GET
   * /pedidos/:id/status, mas nenhuma tela de convidado consome isso hoje). */
  linkAcompanhamento?: string;
  codigoRastreio?: string;
}

export function formatarMoedaEmail(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
