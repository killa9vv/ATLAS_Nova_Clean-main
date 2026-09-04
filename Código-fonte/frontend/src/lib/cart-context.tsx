'use client';

import { ReactNode, createContext, useContext, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adicionarItemCarrinho,
  atualizarQuantidadeItemCarrinho,
  buscarCarrinho,
  limparCarrinhoServidor,
  removerItemCarrinho,
  type CarrinhoServidor,
} from '@/lib/carrinho-api';

export type { ItemCarrinhoServidor as ItemCarrinho, ItemCarrinhoIndisponivel } from '@/lib/carrinho-api';

export const CHAVE_QUERY_CARRINHO = ['carrinho'] as const;

const CARRINHO_VAZIO: CarrinhoServidor = { itens: [], itensIndisponiveis: [], total: 0 };

interface CartContextValue {
  itens: CarrinhoServidor['itens'];
  itensIndisponiveis: CarrinhoServidor['itensIndisponiveis'];
  total: number;
  /** false enquanto o carrinho (agora persistido no servidor) ainda não terminou de
   * carregar. Consumidores que decidem algo com base em "carrinho vazio" (ex.:
   * redirecionar pra fora do checkout) precisam esperar isso virar true antes de
   * checar `itens.length`, senão tratam o carregamento inicial como vazio de verdade.
   * Falha de rede também vira `hidratado: true` (degrada pra carrinho vazio) — nunca
   * trava indefinidamente. */
  hidratado: boolean;
  quantidadeTotal: number;
  adicionar: (produtoId: string, quantidade?: number) => Promise<void>;
  remover: (produtoId: string) => Promise<void>;
  atualizarQuantidade: (produtoId: string, quantidade: number) => Promise<void>;
  limpar: () => Promise<void>;
  /** Drawer lateral (mesmo padrão do site antigo: botão do header abre uma prévia
   * do carrinho na lateral, em vez de navegar direto pra uma página cheia). */
  drawerAberto: boolean;
  abrirDrawer: () => void;
  fecharDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart precisa ser usado dentro de <CartProvider>');
  }
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [drawerAberto, setDrawerAberto] = useState(false);

  // Mesma queryKey usada por qualquer outro componente que precise da instância de
  // carrinho crua (ex.: checkout, pra chamar .refetch() antes de criar o pedido) —
  // react-query compartilha o cache por key, não precisa passar isso pelo contexto.
  const carrinhoQuery = useQuery({ queryKey: CHAVE_QUERY_CARRINHO, queryFn: buscarCarrinho });

  function aposMutar() {
    return queryClient.invalidateQueries({ queryKey: CHAVE_QUERY_CARRINHO });
  }

  const adicionarMutation = useMutation({
    mutationFn: ({ produtoId, quantidade }: { produtoId: string; quantidade: number }) =>
      adicionarItemCarrinho(produtoId, quantidade),
    onSuccess: aposMutar,
  });
  const atualizarQuantidadeMutation = useMutation({
    mutationFn: ({ produtoId, quantidade }: { produtoId: string; quantidade: number }) =>
      atualizarQuantidadeItemCarrinho(produtoId, quantidade),
    onSuccess: aposMutar,
  });
  const removerMutation = useMutation({
    mutationFn: (produtoId: string) => removerItemCarrinho(produtoId),
    onSuccess: aposMutar,
  });
  const limparMutation = useMutation({
    mutationFn: () => limparCarrinhoServidor(),
    onSuccess: aposMutar,
  });

  const carrinho = carrinhoQuery.data ?? CARRINHO_VAZIO;
  const hidratado = !carrinhoQuery.isLoading;
  const quantidadeTotal = carrinho.itens.reduce((soma, item) => soma + item.quantidade, 0);

  async function adicionar(produtoId: string, quantidade = 1) {
    await adicionarMutation.mutateAsync({ produtoId, quantidade });
  }

  async function remover(produtoId: string) {
    await removerMutation.mutateAsync(produtoId);
  }

  async function atualizarQuantidade(produtoId: string, quantidade: number) {
    await atualizarQuantidadeMutation.mutateAsync({ produtoId, quantidade });
  }

  async function limpar() {
    await limparMutation.mutateAsync();
  }

  return (
    <CartContext.Provider
      value={{
        itens: carrinho.itens,
        itensIndisponiveis: carrinho.itensIndisponiveis,
        total: carrinho.total,
        hidratado,
        quantidadeTotal,
        adicionar,
        remover,
        atualizarQuantidade,
        limpar,
        drawerAberto,
        abrirDrawer: () => setDrawerAberto(true),
        fecharDrawer: () => setDrawerAberto(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
