'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BANNER_SLIDES } from '@/data/banners';
import { hrefWhatsApp } from '@/lib/whatsapp';

const INTERVALO_AUTOPLAY_MS = 6000;

const STAT_PILLS = [
  { icone: '🚚', texto: 'Entrega rápida em Campos' },
  { icone: '💳', texto: 'Pix, cartão ou combinado no WhatsApp' },
  { icone: '📦', texto: 'Atacado e varejo' },
];

export function Hero() {
  const total = BANNER_SLIDES.length;
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reducedMotionRef = useRef(false);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const irPara = useCallback(
    (indice: number) => {
      setIndiceAtivo(((indice % total) + total) % total);
    },
    [total],
  );

  const proximo = useCallback(() => irPara(indiceAtivo + 1), [indiceAtivo, irPara]);
  const anterior = useCallback(() => irPara(indiceAtivo - 1), [indiceAtivo, irPara]);

  // Autoplay: pausa com hover/foco em qualquer parte do carrossel e respeita
  // prefers-reduced-motion (não roda nada nesse caso, igual ao MarcasCarousel).
  useEffect(() => {
    if (total <= 1 || pausado || reducedMotionRef.current) return;
    const id = setInterval(() => {
      setIndiceAtivo((atual) => (atual + 1) % total);
    }, INTERVALO_AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [pausado, total]);

  function aoTecla(evento: React.KeyboardEvent) {
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      proximo();
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      anterior();
    }
  }

  const slideAtivo = BANNER_SLIDES[indiceAtivo];

  return (
    <section className="relative overflow-hidden py-14">
      <div
        ref={regionRef}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Banners promocionais"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={(evento) => {
          if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) {
            setPausado(false);
          }
        }}
        onKeyDown={aoTecla}
        className="relative"
      >
        {/* Anunciado só pra leitor de tela — o conteúdo visual já troca de slide. */}
        <p aria-live="polite" className="sr-only">
          Slide {indiceAtivo + 1} de {total}: {slideAtivo.titulo} {slideAtivo.destaque}
        </p>

        {BANNER_SLIDES.map((slide, indice) => {
          const ativo = indice === indiceAtivo;
          return (
            <div
              key={slide.id}
              aria-roledescription="slide"
              aria-label={`${indice + 1} de ${total}`}
              aria-hidden={!ativo}
              className={[
                'transition-opacity duration-500 motion-reduce:transition-none',
                ativo ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0',
              ].join(' ')}
            >
              {/* Palco dos blobs sem overflow-hidden próprio (só a section tem) — assim eles
                  podem "vazar" bem além da largura do conteúdo (1180px) e o desfoque tem
                  espaço de sobra pra sumir antes de qualquer borda visível, em vez de ser
                  cortado de repente numa linha reta. */}
              <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-[1180px] -translate-x-1/2">
                <span
                  aria-hidden="true"
                  className="animate-blob-float motion-reduce:animate-none absolute -top-[150px] -right-[40px] h-[380px] w-[380px] rounded-full opacity-35 blur-[70px]"
                  style={{ background: slide.corBlob1 }}
                />
                <span
                  aria-hidden="true"
                  className="animate-blob-float motion-reduce:animate-none absolute -bottom-[130px] -left-[60px] h-[300px] w-[300px] rounded-full opacity-35 blur-[70px]"
                  style={{ background: slide.corBlob2, animationDelay: '-5s' }}
                />
              </div>

              <div className="relative mx-auto max-w-[1180px] px-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
                  {slide.eyebrow}
                </p>
                <h1 className="font-display max-w-2xl text-[clamp(32px,4.2vw,54px)] font-bold leading-[1.05] tracking-tight text-navy">
                  {slide.titulo}{' '}
                  <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">
                    {slide.destaque}
                  </span>
                </h1>
                <p className="mt-4 max-w-md text-[15px] text-muted">{slide.texto}</p>
                <Link
                  href={slide.ctaHref === 'whatsapp' ? hrefWhatsApp() : slide.ctaHref}
                  target={slide.ctaHref === 'whatsapp' ? '_blank' : undefined}
                  rel={slide.ctaHref === 'whatsapp' ? 'noopener noreferrer' : undefined}
                  tabIndex={ativo ? undefined : -1}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-[13px] font-bold text-white hover:bg-navy-2"
                >
                  {slide.ctaTexto} →
                </Link>
              </div>
            </div>
          );
        })}

        {total > 1 && (
          <div className="relative mx-auto mt-8 flex max-w-[1180px] items-center gap-4 px-5">
            <button
              type="button"
              aria-label="Banner anterior"
              onClick={anterior}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg font-bold text-navy shadow-atlas hover:bg-sky"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {BANNER_SLIDES.map((slide, indice) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Ir para o banner ${indice + 1} de ${total}`}
                  aria-current={indice === indiceAtivo}
                  onClick={() => irPara(indice)}
                  // Área de toque de 24x24 (padding invisível) em volta do pontinho visual,
                  // que continua pequeno — só o alvo clicável cresce.
                  className="flex h-6 w-6 items-center justify-center"
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'h-2.5 rounded-full transition-all',
                      indice === indiceAtivo ? 'w-6 bg-navy' : 'w-2.5 bg-line hover:bg-navy/40',
                    ].join(' ')}
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Próximo banner"
              onClick={proximo}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-lg font-bold text-navy shadow-atlas hover:bg-sky"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="relative mx-auto mt-8 flex max-w-[1180px] flex-wrap gap-2.5 px-5">
        {STAT_PILLS.map((pill) => (
          <span
            key={pill.texto}
            className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[12.5px] font-semibold text-navy shadow-atlas"
          >
            <span aria-hidden="true">{pill.icone}</span>
            {pill.texto}
          </span>
        ))}
      </div>
    </section>
  );
}
