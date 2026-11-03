'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

export interface TiltCardProps {
  children: ReactNode;
  /** Inclinação máxima, em graus. */
  tiltLimit?: number;
  /** Escala com o mouse em cima. */
  scale?: number;
  /** Cor do brilho que acompanha o mouse. */
  corBrilho: string;
  className?: string;
}

// Adaptado de @spell/tilt-card (spell.sh). Mudanças: escreve direto no estilo em vez de
// usar state (senão cada movimento do mouse renderiza de novo), só reage a mouse (no toque
// o card ficava torto depois do toque) e respeita prefers-reduced-motion. O brilho usa
// multiply pra tingir o card sem apagar o texto por baixo.
export function TiltCard({
  children,
  tiltLimit = 6,
  scale = 1.02,
  corBrilho,
  className = '',
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  function aoMover(evento: PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card || evento.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const caixa = card.getBoundingClientRect();
    const x = (evento.clientX - caixa.left) / caixa.width;
    const y = (evento.clientY - caixa.top) / caixa.height;
    const rotacaoX = (y - 0.5) * -tiltLimit * 2;
    const rotacaoY = (x - 0.5) * tiltLimit * 2;

    card.style.transform = `perspective(900px) rotateX(${rotacaoX}deg) rotateY(${rotacaoY}deg) scale(${scale})`;
    card.style.setProperty('--brilho-x', `${x * 100}%`);
    card.style.setProperty('--brilho-y', `${y * 100}%`);
  }

  function aoSair() {
    if (cardRef.current) cardRef.current.style.transform = '';
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={aoMover}
      onPointerLeave={aoSair}
      className={`group/tilt relative transition-transform duration-200 ease-out ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-multiply transition-opacity duration-200 group-hover/tilt:opacity-100 motion-reduce:hidden"
        style={{
          background: `radial-gradient(circle 140px at var(--brilho-x, 50%) var(--brilho-y, 50%), ${corBrilho}, transparent)`,
        }}
      />
    </div>
  );
}
