export interface ItemPedidoParaWhatsApp {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface PedidoParaWhatsApp {
  id: string;
  itens: ItemPedidoParaWhatsApp[];
  total: number;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  endereco?: { logradouro: string; numero: string };
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// numero deve estar em E.164 sem "+" (ex.: 5522999998888) — vem de
// NEXT_PUBLIC_WHATSAPP_NUMERO.
export function montarLinkWhatsApp(numero: string, pedido: PedidoParaWhatsApp): string {
  const linhas = [
    `Olá! Meu pedido #${pedido.id.slice(0, 8)} foi registrado no site.`,
    ...pedido.itens.map(
      (item) => `• ${item.quantidade}x ${item.nome} — ${formatarMoeda(item.precoUnitario)}`,
    ),
    `Total: ${formatarMoeda(pedido.total)}`,
    pedido.tipoEntrega === 'ENTREGA' && pedido.endereco
      ? `Entrega: ${pedido.endereco.logradouro}, ${pedido.endereco.numero}`
      : 'Retirada na loja',
  ];
  const texto = encodeURIComponent(linhas.join('\n'));
  return `https://wa.me/${numero}?text=${texto}`;
}
