'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

interface CartContextValue {
  itens: ItemCarrinho[];
  /** false até o carrinho salvo no localStorage terminar de carregar. Consumidores
   * que decidem algo com base em "carrinho vazio" (ex.: redirecionar pra fora do
   * checkout) precisam esperar isso virar true antes de checar `itens.length`, senão
   * tratam o instante inicial (sempre vazio, antes da hidratação) como vazio de verdade. */
  hidratado: boolean;
  quantidadeTotal: number;
  adicionar: (produtoId: string, nome: string, precoUnitario: number, quantidade?: number) => void;
  remover: (produtoId: string) => void;
  atualizarQuantidade: (produtoId: string, quantidade: number) => void;
  limpar: () => void;
  /** Drawer lateral (mesmo padrão do site antigo: botão do header abre uma prévia
   * do carrinho na lateral, em vez de navegar direto pra uma página cheia). */
  drawerAberto: boolean;
  abrirDrawer: () => void;
  fecharDrawer: () => void;
}

const CHAVE_LOCALSTORAGE = 'atlas-carrinho';

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart precisa ser usado dentro de <CartProvider>');
  }
  return ctx;
}

function lerCarrinhoSalvo(): ItemCarrinho[] {
  if (typeof window === 'undefined') return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE_LOCALSTORAGE);
    return bruto ? (JSON.parse(bruto) as ItemCarrinho[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Começa vazio pra bater com a marcação renderizada no servidor (que nunca tem
  // acesso a localStorage) — ler localStorage já no useState via lazy init causaria
  // mismatch de hidratação sempre que o carrinho não estivesse vazio. `hidratado`
  // separa "carreguei do localStorage" de "itens mudou por uma ação do usuário", pra
  // esse carregamento inicial não disparar o efeito de gravação com um array vazio
  // por cima do que já estava salvo.
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItens(lerCarrinhoSalvo());
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    window.localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(itens));
  }, [itens, hidratado]);

  function adicionar(produtoId: string, nome: string, precoUnitario: number, quantidade = 1) {
    setItens((prev) => {
      const existente = prev.find((item) => item.produtoId === produtoId);
      if (existente) {
        return prev.map((item) =>
          item.produtoId === produtoId
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item,
        );
      }
      return [...prev, { produtoId, nome, precoUnitario, quantidade }];
    });
  }

  function remover(produtoId: string) {
    setItens((prev) => prev.filter((item) => item.produtoId !== produtoId));
  }

  function atualizarQuantidade(produtoId: string, quantidade: number) {
    if (quantidade <= 0) {
      remover(produtoId);
      return;
    }
    setItens((prev) =>
      prev.map((item) => (item.produtoId === produtoId ? { ...item, quantidade } : item)),
    );
  }

  function limpar() {
    setItens([]);
  }

  const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        itens,
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
