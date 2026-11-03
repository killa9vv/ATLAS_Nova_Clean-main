'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useImagemPrincipal } from '@/hooks/use-imagem-principal';
import { buscarProduto } from '@/lib/produtos';

export interface CarrinhoItemImagemProps {
  produtoId: string;
  nome: string;
  tamanho?: number;
}

// O item de carrinho (ItemCarrinhoServidor) não traz marca/categoria, então o logo da marca
// exige buscar o produto. A busca só acontece sem foto, e é o que evita mostrar um frasco de
// limpeza pra um lápis. O ícone final é uma caixa neutra, que serve pra qualquer categoria.
export function CarrinhoItemImagem({ produtoId, nome, tamanho = 56 }: CarrinhoItemImagemProps) {
  const { principal, carregando } = useImagemPrincipal(produtoId);
  const { data: produto } = useQuery({
    queryKey: ['produto', produtoId],
    queryFn: () => buscarProduto(produtoId),
    enabled: !carregando && !principal,
    staleTime: 5 * 60 * 1000,
  });
  const logoMarca = produto?.marca?.imagemUrl;

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
      ) : logoMarca ? (
        <Image
          src={logoMarca}
          alt=""
          fill
          sizes={`${tamanho}px`}
          // Vários logos têm fundo branco: sem isso, viram um retângulo sobre o azul-claro.
          className="object-contain p-1.5 mix-blend-multiply"
        />
      ) : (
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
        >
          <path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8" />
        </svg>
      )}
    </div>
  );
}
