'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CLASSES_CARDS_VIVOS, ProductCard } from './ProductCard';
import type { EntradaNaTela } from '@/hooks/use-entrada-na-tela';
import { comFotoPrimeiro, type Produto } from '@/lib/produtos';

const PASSO_ROLAGEM_PX = 460;
const FOLGA_LIMITE_PX = 4;
const LARGURA_ESMAECIDO_PX = 32;

export interface ProductCarouselProps {
  produtos: Produto[];
  /** Rótulo pro grupo de setas — ex: "produtos em Novidades". */
  rotulo: string;
  /** Liga a versão animada (Novidades): sem isso, o carrossel fica como sempre foi. */
  entrada?: EntradaNaTela;
}

// Na versão animada, a trilha tem folga embaixo porque overflow-x também corta na vertical e
// a sombra dos cards aparecia cortada.
const CLASSES_TRILHA_ANIMADA = `px-1 pb-8 pt-2 -mb-7 scroll-px-1 ${CLASSES_CARDS_VIVOS}`;
const CLASSES_SETA_ANIMADA =
  'transition-[scale,opacity] hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-30';

// Carrossel de produto NÃO tem autoplay de propósito: diferente do banner e do
// carrossel de marcas (puramente decorativos/navegação), aqui cada card tem um botão
// "Adicionar" — o conteúdo se mexer sozinho embaixo do cursor/foco do usuário nesse
// contexto é um problema de usabilidade, não só de acessibilidade.
export function ProductCarousel({ produtos, rotulo, entrada }: ProductCarouselProps) {
  const trilhaRef = useRef<HTMLDivElement>(null);
  const animado = entrada !== undefined;
  const [limites, setLimites] = useState({ inicio: true, fim: false });

  const medirLimites = useCallback(() => {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    setLimites({
      inicio: trilha.scrollLeft <= FOLGA_LIMITE_PX,
      fim: trilha.scrollLeft + trilha.clientWidth >= trilha.scrollWidth - FOLGA_LIMITE_PX,
    });
  }, []);

  useEffect(() => {
    const trilha = trilhaRef.current;
    if (!animado || !trilha) return;
    const observador = new ResizeObserver(medirLimites);
    observador.observe(trilha);
    return () => observador.disconnect();
  }, [animado, medirLimites]);

  function rolar(direcao: 1 | -1) {
    trilhaRef.current?.scrollBy({ left: direcao * PASSO_ROLAGEM_PX, behavior: 'smooth' });
  }

  // Esmaece só o lado que ainda tem produto, mostrando que dá pra continuar rolando.
  const mascara = `linear-gradient(to right, ${limites.inicio ? 'black' : 'transparent'}, black ${LARGURA_ESMAECIDO_PX}px, black calc(100% - ${LARGURA_ESMAECIDO_PX}px), ${limites.fim ? 'black' : 'transparent'})`;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Ver ${rotulo} anteriores`}
        onClick={() => rolar(-1)}
        disabled={animado && limites.inicio}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg font-bold text-navy shadow-atlas-lg hover:bg-sky nav:flex hidden ${animado ? CLASSES_SETA_ANIMADA : ''}`}
      >
        ‹
      </button>

      <div
        ref={trilhaRef}
        onScroll={animado ? medirLimites : undefined}
        className={`flex snap-x snap-mandatory gap-[18px] overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden ${animado ? CLASSES_TRILHA_ANIMADA : 'py-1'}`}
        style={{
          scrollbarWidth: 'none',
          ...(animado && { maskImage: mascara, WebkitMaskImage: mascara }),
        }}
      >
        {comFotoPrimeiro(produtos).map((produto, indice) => (
          <div
            key={produto.id}
            className={[
              'w-[220px] shrink-0 snap-start',
              // flex + *:w-full: os cards de uma mesma fileira ficam com a mesma altura.
              animado && 'flex *:w-full',
              entrada === 'aguardando' && 'opacity-0',
              entrada === 'entrando' && 'animate-card-in',
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              entrada === 'entrando'
                ? { animationDelay: `${Math.min(indice, 5) * 80}ms` }
                : undefined
            }
          >
            <ProductCard produto={produto} indice={indice} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label={`Ver próximos ${rotulo}`}
        onClick={() => rolar(1)}
        disabled={animado && limites.fim}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg font-bold text-navy shadow-atlas-lg hover:bg-sky nav:flex hidden ${animado ? CLASSES_SETA_ANIMADA : ''}`}
      >
        ›
      </button>
    </div>
  );
}
