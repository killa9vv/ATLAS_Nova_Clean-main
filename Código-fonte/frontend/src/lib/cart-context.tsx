'use client';

import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import {
  adicionarItemCarrinho,
  aplicarCupomCarrinho,
  atualizarQuantidadeItemCarrinho,
  buscarCarrinho,
  limparCarrinhoServidor,
  removerCupomCarrinho,
  removerItemCarrinho,
  type CarrinhoServidor,
} from '@/lib/carrinho-api';
import { ApiError } from '@/lib/http';

export type {
  ItemCarrinhoServidor as ItemCarrinho,
  ItemCarrinhoIndisponivel,
} from '@/lib/carrinho-api';

export const CHAVE_QUERY_CARRINHO = ['carrinho'] as const;

const CARRINHO_VAZIO: CarrinhoServidor = {
  itens: [],
  itensIndisponiveis: [],
  total: 0,
  descontoAtacado: 0,
  desconto: 0,
  totalComDesconto: 0,
};

// Quantos ms esperar sem um novo clique antes de mandar a quantidade pro servidor —
// cliques rápidos no +/- atualizam a UI na hora (via setQueryData otimista) mas só
// geram UMA requisição, com o valor final, em vez de uma por clique.
const DEBOUNCE_QUANTIDADE_MS = 500;

interface CartContextValue {
  itens: CarrinhoServidor['itens'];
  itensIndisponiveis: CarrinhoServidor['itensIndisponiveis'];
  total: number;
  /** 0 quando nenhuma regra de atacado (desconto automático por quantidade) se
   * aplica a nenhum item do carrinho. */
  descontoAtacado: number;
  /** 0 quando nenhum cupom válido está aplicado (ver Carrinho.cupomCodigo no backend). */
  desconto: number;
  totalComDesconto: number;
  cupomCodigo: string | undefined;
  /** false enquanto o carrinho (agora persistido no servidor) ainda não terminou de
   * carregar. Consumidores que decidem algo com base em "carrinho vazio" (ex.:
   * redirecionar pra fora do checkout) precisam esperar isso virar true antes de
   * checar `itens.length`, senão tratam o carregamento inicial como vazio de verdade.
   * Falha de rede também vira `hidratado: true` (degrada pra carrinho vazio) — nunca
   * trava indefinidamente. */
  hidratado: boolean;
  quantidadeTotal: number;
  adicionar: (produtoId: string, quantidade?: number) => Promise<void>;
  /** Otimista + debounced (mesmo caminho de `atualizarQuantidade`, com quantidade 0) —
   * não espera a requisição real terminar, por isso não devolve Promise. */
  remover: (produtoId: string) => void;
  /** Otimista + debounced: a UI reflete a nova quantidade na hora; a requisição de
   * verdade só sai DEBOUNCE_QUANTIDADE_MS depois do último clique pro mesmo produto.
   * Reverte sozinho (com toast) se a requisição eventualmente falhar. */
  atualizarQuantidade: (produtoId: string, quantidade: number) => void;
  limpar: () => Promise<void>;
  /** Lança a mensagem de erro do backend (ex: cupom inválido/expirado) — quem chama
   * decide como mostrar. */
  aplicarCupom: (cupomCodigo: string) => Promise<void>;
  removerCupom: () => Promise<void>;
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

/** Projeção local só pra o instante entre o clique e a resposta do servidor — nunca
 * é o dado que vai pro checkout (isso sempre vem fresco da API). Desconto/cupom não
 * são recalculados aqui (dependeria da regra do cupom, que só o backend conhece) —
 * ficam com o valor anterior até o refetch corrigir, o que é inofensivo por uma
 * fração de segundo. */
function comQuantidadeOtimista(
  carrinho: CarrinhoServidor,
  produtoId: string,
  quantidade: number,
): CarrinhoServidor {
  const itens =
    quantidade <= 0
      ? carrinho.itens.filter((item) => item.produtoId !== produtoId)
      : carrinho.itens.map((item) =>
          item.produtoId === produtoId
            ? { ...item, quantidade, subtotal: item.precoUnitario * quantidade }
            : item,
        );
  const total = Number(itens.reduce((soma, item) => soma + item.subtotal, 0).toFixed(2));
  return {
    ...carrinho,
    itens,
    total,
    totalComDesconto: Number(
      (total - (carrinho.descontoAtacado ?? 0) - carrinho.desconto).toFixed(2),
    ),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [drawerAberto, setDrawerAberto] = useState(false);
  // Um timer de debounce por produto — mexer na quantidade de um item não deve
  // adiar/cancelar o debounce de outro item mexido em seguida.
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Mesma queryKey usada por qualquer outro componente que precise da instância de
  // carrinho crua (ex.: checkout, pra chamar .refetch() antes de criar o pedido) —
  // react-query compartilha o cache por key, não precisa passar isso pelo contexto.
  const carrinhoQuery = useQuery({ queryKey: CHAVE_QUERY_CARRINHO, queryFn: buscarCarrinho });

  // Toda rota que altera o carrinho já devolve o carrinho atualizado inteiro — usa
  // essa resposta direto em vez de invalidar e buscar de novo (era uma segunda ida
  // ao servidor a cada "adicionar", ~1s a mais de espera pro cliente).
  function aposMutar(carrinhoAtualizado: CarrinhoServidor) {
    queryClient.setQueryData(CHAVE_QUERY_CARRINHO, carrinhoAtualizado);
  }

  const adicionarMutation = useMutation({
    mutationFn: ({ produtoId, quantidade }: { produtoId: string; quantidade: number }) =>
      adicionarItemCarrinho(produtoId, quantidade),
    onSuccess: aposMutar,
  });

  // Sem onSuccess/invalidate aqui de propósito — quem dispara essa mutation
  // (atualizarQuantidade abaixo) já cuida do otimismo e da reconciliação via
  // onSettled, pra não brigar com o debounce.
  const atualizarQuantidadeMutation = useMutation({
    mutationFn: ({ produtoId, quantidade }: { produtoId: string; quantidade: number }) =>
      quantidade <= 0
        ? removerItemCarrinho(produtoId)
        : atualizarQuantidadeItemCarrinho(produtoId, quantidade),
  });

  const limparMutation = useMutation({
    mutationFn: () => limparCarrinhoServidor(),
    onSuccess: aposMutar,
  });
  const aplicarCupomMutation = useMutation({
    mutationFn: (cupomCodigo: string) => aplicarCupomCarrinho(cupomCodigo),
    onSuccess: aposMutar,
  });
  const removerCupomMutation = useMutation({
    mutationFn: () => removerCupomCarrinho(),
    onSuccess: aposMutar,
  });

  const carrinho = carrinhoQuery.data ?? CARRINHO_VAZIO;
  const hidratado = !carrinhoQuery.isLoading;
  const quantidadeTotal = carrinho.itens.reduce((soma, item) => soma + item.quantidade, 0);

  // Dispara só quando a MENSAGEM muda de valor (não a cada refetch) — o backend só
  // preenche avisoCupom na leitura em que um cupom salvo acabou de ser invalidado e
  // removido; a leitura seguinte já vem sem cupomCodigo, então isso não repete.
  useEffect(() => {
    if (carrinho.avisoCupom) {
      showToast(carrinho.avisoCupom, 'error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrinho.avisoCupom]);

  async function adicionar(produtoId: string, quantidade = 1) {
    await adicionarMutation.mutateAsync({ produtoId, quantidade });
  }

  function remover(produtoId: string) {
    // Reaproveita o mesmo caminho otimista/debounced com quantidade 0 — remoção é
    // só um caso particular de "mudar quantidade", inclusive pro rollback.
    atualizarQuantidade(produtoId, 0);
  }

  function atualizarQuantidade(produtoId: string, quantidade: number) {
    const anterior = queryClient.getQueryData<CarrinhoServidor>(CHAVE_QUERY_CARRINHO);
    if (!anterior) return; // ainda não hidratou — não há o que otimizar em cima

    // Atualiza a UI na hora, a cada clique — isso NÃO espera o debounce.
    queryClient.setQueryData<CarrinhoServidor>(CHAVE_QUERY_CARRINHO, (atual) =>
      atual ? comQuantidadeOtimista(atual, produtoId, quantidade) : atual,
    );

    const timerAnterior = timersRef.current.get(produtoId);
    if (timerAnterior) clearTimeout(timerAnterior);

    const timer = setTimeout(async () => {
      timersRef.current.delete(produtoId);
      try {
        const resultado = await atualizarQuantidadeMutation.mutateAsync({ produtoId, quantidade });
        queryClient.setQueryData(CHAVE_QUERY_CARRINHO, resultado);
      } catch (erro) {
        // Reverte pro que o servidor realmente tem (não pro estado otimista, que já
        // provou estar errado) — busca de novo em vez de usar `anterior`, que pode
        // estar desatualizado se outra mudança aconteceu nesse meio-tempo.
        await queryClient.invalidateQueries({ queryKey: CHAVE_QUERY_CARRINHO });
        showToast(
          erro instanceof ApiError
            ? erro.message
            : 'Não foi possível atualizar o carrinho agora. Tente de novo.',
          'error',
        );
      }
    }, DEBOUNCE_QUANTIDADE_MS);
    timersRef.current.set(produtoId, timer);
  }

  async function limpar() {
    await limparMutation.mutateAsync();
  }

  async function aplicarCupom(cupomCodigo: string) {
    await aplicarCupomMutation.mutateAsync(cupomCodigo);
  }

  async function removerCupom() {
    await removerCupomMutation.mutateAsync();
  }

  return (
    <CartContext.Provider
      value={{
        itens: carrinho.itens,
        itensIndisponiveis: carrinho.itensIndisponiveis,
        total: carrinho.total,
        descontoAtacado: carrinho.descontoAtacado ?? 0,
        desconto: carrinho.desconto,
        totalComDesconto: carrinho.totalComDesconto,
        cupomCodigo: carrinho.cupomCodigo,
        hidratado,
        quantidadeTotal,
        adicionar,
        remover,
        atualizarQuantidade,
        limpar,
        aplicarCupom,
        removerCupom,
        drawerAberto,
        abrirDrawer: () => setDrawerAberto(true),
        fecharDrawer: () => setDrawerAberto(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
