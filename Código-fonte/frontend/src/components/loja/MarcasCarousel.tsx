'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export interface MarcaComContagem {
  id: string;
  nome: string;
  imagemUrl?: string;
  quantidade: number;
}

export interface MarcasCarouselProps {
  marcas: MarcaComContagem[];
}

const PASSO_ROLAGEM_PX = 320;
const VELOCIDADE_AUTOPLAY_PX_POR_FRAME = 0.6;
const PAUSA_APOS_INTERACAO_MS = 3000;

function CardMarca({
  marca,
  escondidoDeLeitorDeTela = false,
}: {
  marca: MarcaComContagem;
  escondidoDeLeitorDeTela?: boolean;
}) {
  return (
    <Link
      href={`/marcas/${encodeURIComponent(marca.nome)}`}
      aria-hidden={escondidoDeLeitorDeTela || undefined}
      tabIndex={escondidoDeLeitorDeTela ? -1 : undefined}
      className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-atlas border border-line bg-white p-3 text-center shadow-atlas transition-transform hover:-translate-y-1"
    >
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
        {marca.imagemUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={marca.imagemUrl}
            alt={marca.nome}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <span className="text-[11px] font-bold text-navy">{marca.nome}</span>
        )}
      </span>
      <span className="text-[11px] text-muted">
        {marca.quantidade} {marca.quantidade === 1 ? 'produto' : 'produtos'}
      </span>
    </Link>
  );
}

// Faixa duplicada (2x a lista real) + scrollLeft incrementado a cada frame, voltando
// pro início assim que passa da metade — dá a sensação de rolagem infinita sem CSS
// transform (que não daria pra combinar com os botões de seta, que usam scrollBy no
// mesmo elemento). Pausa com o mouse em cima ou por alguns segundos depois de
// qualquer interação manual (seta ou arrastar/rolar no touch).
export function MarcasCarousel({ marcas }: MarcasCarouselProps) {
  const trilhaRef = useRef<HTMLDivElement>(null);
  const pausadoRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function pausarTemporariamente() {
    pausadoRef.current = true;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      pausadoRef.current = false;
    }, PAUSA_APOS_INTERACAO_MS);
  }

  function rolar(direcao: 1 | -1) {
    trilhaRef.current?.scrollBy({ left: direcao * PASSO_ROLAGEM_PX, behavior: 'smooth' });
    pausarTemporariamente();
  }

  useEffect(() => {
    const trilha = trilhaRef.current;
    if (!trilha || marcas.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frameId: number;
    function avancar() {
      if (!pausadoRef.current && trilha) {
        const metade = trilha.scrollWidth / 2;
        if (trilha.scrollLeft >= metade) {
          trilha.scrollLeft -= metade;
        } else {
          trilha.scrollLeft += VELOCIDADE_AUTOPLAY_PX_POR_FRAME;
        }
      }
      frameId = requestAnimationFrame(avancar);
    }
    frameId = requestAnimationFrame(avancar);
    return () => cancelAnimationFrame(frameId);
  }, [marcas.length]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Ver marcas anteriores"
        onClick={() => rolar(-1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg font-bold text-navy shadow-atlas-lg hover:bg-sky"
      >
        ‹
      </button>

      <div
        ref={trilhaRef}
        onMouseEnter={() => {
          pausadoRef.current = true;
        }}
        onMouseLeave={() => {
          pausadoRef.current = false;
        }}
        onPointerDown={pausarTemporariamente}
        className="flex gap-4 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {marcas.map((marca) => (
          <CardMarca key={marca.id} marca={marca} />
        ))}
        {marcas.map((marca) => (
          <CardMarca key={`${marca.id}-dup`} marca={marca} escondidoDeLeitorDeTela />
        ))}
      </div>

      <button
        type="button"
        aria-label="Ver próximas marcas"
        onClick={() => rolar(1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg font-bold text-navy shadow-atlas-lg hover:bg-sky"
      >
        ›
      </button>
    </div>
  );
}
