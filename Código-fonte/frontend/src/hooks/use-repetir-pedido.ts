'use client';

import { useMutation } from '@tanstack/react-query';
import { useCart } from '@/lib/cart-context';
import { repetirPedido } from '@/lib/conta';
import { ApiError } from '@/lib/http';
import { useToast } from '@/components/ui/Toast';

// Põe no carrinho o que ainda está disponível de um pedido antigo e abre a gaveta.
export function useRepetirPedido() {
  const { showToast } = useToast();
  const { adicionar, abrirDrawer } = useCart();

  return useMutation({
    mutationFn: (pedidoId: string) => repetirPedido(pedidoId),
    onSuccess: async (resultado) => {
      // Sequencial (não Promise.all) — cada POST /carrinho/itens é uma escrita no
      // mesmo carrinho; disparar todas em paralelo arriscaria corrida entre elas.
      for (const item of resultado.itens) {
        await adicionar(item.produtoId, item.quantidade);
      }

      if (resultado.itens.length > 0) {
        showToast(
          `${resultado.itens.length} ${resultado.itens.length === 1 ? 'item adicionado' : 'itens adicionados'} ao carrinho.`,
          'success',
        );
      }
      if (resultado.itensIndisponiveis.length > 0) {
        showToast(
          `Não disponível: ${resultado.itensIndisponiveis.map((i) => i.nome).join(', ')}.`,
          'error',
        );
      }
      if (resultado.itens.length > 0) {
        abrirDrawer();
      }
    },
    onError: (erro) => {
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível repetir o pedido.',
        'error',
      );
    },
  });
}
