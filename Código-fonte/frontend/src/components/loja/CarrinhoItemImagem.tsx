'use client';

import Image from 'next/image';
import { useImagemPrincipal } from '@/hooks/use-imagem-principal';

export interface CarrinhoItemImagemProps {
  produtoId: string;
  nome: string;
  tamanho?: number;
}

// O item de carrinho (ItemCarrinhoServidor) não traz marca/categoria — só
// produtoId/nome/preço/quantidade — então o fallback aqui é só 2 níveis (foto real
// → ícone genérico), diferente do ProductCard/ProdutoGaleria que também caem pro
// logo da marca. Buscar o produto completo só pra esse fallback extra não valeria
// a chamada de API a mais.
export function CarrinhoItemImagem({ produtoId, nome, tamanho = 56 }: CarrinhoItemImagemProps) {
  const { principal } = useImagemPrincipal(produtoId);

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-atlas-sm bg-sky"
      style={{ width: tamanho, height: tamanho }}
    >
      {principal ? (
        <Image
          src={principal.thumbnailUrl}
          alt={nome}
          fill
          sizes={`${tamanho}px`}
          className="object-contain p-1"
        />
      ) : (
        <span className="text-lg opacity-60" aria-hidden="true">
          🧴
        </span>
      )}
    </div>
  );
}
