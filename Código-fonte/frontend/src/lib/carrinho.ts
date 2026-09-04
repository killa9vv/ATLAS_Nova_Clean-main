import { api } from '@/lib/http';
import type { ItemCarrinho } from '@/lib/cart-context';

export interface ItemCarrinhoCalculado {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface CarrinhoCalculado {
  itens: ItemCarrinhoCalculado[];
  total: number;
  desconto: number;
  totalComDesconto: number;
  cupomCodigo?: string;
}

// Preço/subtotal sempre vêm daqui — nunca do snapshot local em ItemCarrinho, que só
// serve pra render otimista (contador do header, etc). O backend revalida preço e
// estoque contra o catálogo a cada chamada, e valida o cupom (409 se inválido/expirado).
export function calcularCarrinho(
  itens: ItemCarrinho[],
  cupomCodigo?: string,
): Promise<CarrinhoCalculado> {
  return api.post<CarrinhoCalculado>('/carrinho/calcular', {
    itens: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
    cupomCodigo: cupomCodigo || undefined,
  });
}

// Query key estável independente da ordem dos itens no array local — evita refetch
// desnecessário quando só a ordem muda (ex.: item movido pra última posição depois
// de atualizar quantidade).
export function chaveCarrinho(itens: ItemCarrinho[]): string {
  return itens
    .map((item) => `${item.produtoId}:${item.quantidade}`)
    .sort()
    .join(',');
}
