'use client';

import { PalavrasStagger } from '@/components/ui/PalavrasStagger';
import { useEntradaNaTela } from '@/hooks/use-entrada-na-tela';
import { ProductCarousel } from './ProductCarousel';
import type { Produto } from '@/lib/produtos';

export function NovidadesVitrine({ produtos }: { produtos: Produto[] }) {
  const { ref, entrada } = useEntradaNaTela<HTMLDivElement>();

  return (
    <div ref={ref}>
      <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inset-0 animate-ping rounded-full bg-green opacity-75 motion-reduce:hidden" />
          <span className="relative h-2 w-2 rounded-full bg-green" />
        </span>
        <span className="texto-brilho">Chegou agora</span>
      </p>
      <h2
        className={`mb-6 font-display text-xl font-bold text-navy ${entrada === 'aguardando' ? 'opacity-0' : ''}`}
      >
        <PalavrasStagger
          texto="Novidades no catálogo"
          animar={entrada === 'entrando'}
          stagger={0.08}
        />
      </h2>
      <ProductCarousel produtos={produtos} rotulo="novidades" entrada={entrada} />
    </div>
  );
}
