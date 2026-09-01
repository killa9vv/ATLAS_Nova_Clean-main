'use client';

import { useQuery } from '@tanstack/react-query';
import { listarImagensProduto } from '@/lib/produtos';

// Foto real do produto (subida pelo admin) tem prioridade sobre qualquer fallback
// (logo da marca, ícone genérico) nos cards e na tela de detalhe — sem isso, uma
// imagem cadastrada no painel nunca aparecia na loja de verdade.
export function useImagemPrincipal(produtoId: string) {
  const query = useQuery({
    queryKey: ['produto-imagens', produtoId],
    queryFn: () => listarImagensProduto(produtoId),
    staleTime: 5 * 60 * 1000,
  });

  const imagens = query.data ?? [];
  const principal = imagens.find((img) => img.principal) ?? imagens[0];

  return { principal, carregando: query.isLoading };
}
