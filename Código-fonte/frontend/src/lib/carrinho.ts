import { api } from '@/lib/http';

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

// Endpoint stateless (POST /carrinho/calcular) — não depende do carrinho persistido
// (ver carrinho-api.ts para esse), só revalida/precifica uma lista de itens sob
// demanda. Usado hoje pra aplicar cupom sobre os itens já resolvidos pelo carrinho
// do servidor (ver checkout/page.tsx) sem precisar guardar o cupom no carrinho
// persistido em si.
export function calcularCarrinho(
  itens: { produtoId: string; quantidade: number }[],
  cupomCodigo?: string,
): Promise<CarrinhoCalculado> {
  return api.post<CarrinhoCalculado>('/carrinho/calcular', {
    itens,
    cupomCodigo: cupomCodigo || undefined,
  });
}
