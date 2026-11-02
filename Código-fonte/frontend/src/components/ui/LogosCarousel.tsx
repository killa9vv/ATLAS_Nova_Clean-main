'use client';

import { Children, useEffect, useState, type ReactNode } from 'react';

export interface LogosCarouselProps {
  children: ReactNode;
  /** Quantos itens aparecem por vez. */
  count: number;
  /** Tempo de cada grupo na tela, em ms. */
  interval?: number;
  /** Duração da animação de cada item, em ms. */
  duration?: number;
  /** Atraso entre um item e o próximo do grupo, em segundos. */
  stagger?: number;
  /** Classes do grupo (gap, wrap etc.). */
  className?: string;
}

// Adaptado de @spell/logos-carousel (spell.sh). Mudanças: keyframes em globals.css
// (o <style jsx> original renomeia as animações, e o componente as chama pelo nome),
// pausa com mouse/foco, grupo escondido fica inert (senão o Tab cai em link invisível)
// e, com um grupo só, não anima (no original ele sumia e não voltava).
export function LogosCarousel({
  children,
  count,
  interval = 2500,
  duration = 600,
  stagger = 0.14,
  className = '',
}: LogosCarouselProps) {
  // anterior é null até a primeira troca: o primeiro grupo aparece parado, sem animar.
  const [{ atual, anterior }, setGrupos] = useState<{ atual: number; anterior: number | null }>({
    atual: 0,
    anterior: null,
  });
  const [pausado, setPausado] = useState(false);

  const itens = Children.toArray(children);
  const grupos: ReactNode[][] = [];
  for (let i = 0; i < itens.length; i += count) {
    grupos.push(itens.slice(i, i + count));
  }
  const totalGrupos = grupos.length;

  useEffect(() => {
    if (pausado || totalGrupos <= 1) return;
    const id = setInterval(() => {
      setGrupos((estado) => ({
        atual: (estado.atual + 1) % totalGrupos,
        anterior: estado.atual,
      }));
    }, interval);
    return () => clearInterval(id);
  }, [pausado, interval, totalGrupos]);

  return (
    <div
      className="grid w-full place-items-center"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {grupos.map((grupo, indiceGrupo) => {
        const visivel = indiceGrupo === atual;
        const saindo = indiceGrupo === anterior;
        const animacao =
          visivel && anterior !== null ? 'logos-enter' : saindo ? 'logos-exit' : undefined;

        return (
          <div
            key={indiceGrupo}
            inert={!visivel}
            className={`flex w-full justify-center ${className}`}
            style={{ gridArea: '1 / 1' }}
          >
            {grupo.map((item, indiceItem) => (
              <div
                key={indiceItem}
                className={animacao ?? (visivel ? undefined : 'opacity-0')}
                style={{
                  animationDelay: `${indiceItem * stagger}s`,
                  animationDuration: `${duration}ms`,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
