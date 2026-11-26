'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BANNER_SLIDES, type BannerSlide } from '@/data/banners';
import type { BannerVitrine } from '@/lib/banners';
import { SITE_URL } from '@/lib/site';
import { hrefWhatsApp } from '@/lib/whatsapp';
import { PalavrasStagger } from '@/components/ui/PalavrasStagger';

const INTERVALO_AUTOPLAY_MS = 6000;
const STAGGER_TITULO_S = 0.1;
const STAGGER_TEXTO_S = 0.04;

// Cada palavra anima sozinha, e background-clip: text não atravessa elementos com
// transform — por isso o degradê é aplicado palavra a palavra, cada uma com o seu
// pedaço, pra continuar parecendo um só. O padding dá espaço às partes de baixo das letras
// (ç, j, p), que seriam cortadas pela caixa da palavra com o leading apertado do título.
function estiloDegrade(indice: number, total: number) {
  const cor = (posicao: number) =>
    `color-mix(in srgb, var(--color-green) ${(posicao / total) * 100}%, var(--color-blue))`;
  return { backgroundImage: `linear-gradient(to right, ${cor(indice)}, ${cor(indice + 1)})` };
}

const STAT_PILLS = [
  { icone: '🚚', texto: 'Entrega rápida em Campos' },
  { icone: '💳', texto: 'Pix, cartão ou combinado no WhatsApp' },
  { icone: '📦', texto: 'Atacado e varejo' },
];

// O carrossel mostra os banners ativos do painel admin; sem nenhum, os slides fixos de
// data/banners. Um banner do painel tem só título, imagem e link, então vira um slide de imagem,
// ou, sem imagem, um slide de texto no mesmo visual dos fixos.
type Slide = ({ origem: 'fixo' } & BannerSlide) | ({ origem: 'painel' } & BannerVitrine);

const CORES_SLIDE_PAINEL = ['#2e9bf5', '#1faa59'];

function rotuloDoSlide(slide: Slide): string {
  return slide.origem === 'fixo' ? `${slide.titulo} ${slide.destaque}` : slide.titulo;
}

// Link do próprio site vira caminho relativo, pra navegar sem recarregar a página.
function destinoDoBanner(linkUrl: string): { href: string; externo: boolean } {
  if (linkUrl.startsWith(SITE_URL))
    return { href: linkUrl.slice(SITE_URL.length) || '/', externo: false };
  return { href: linkUrl, externo: !linkUrl.startsWith('/') };
}

export interface HeroProps {
  banners?: BannerVitrine[];
}

export function Hero({ banners = [] }: HeroProps) {
  const slides: Slide[] =
    banners.length > 0
      ? banners.map((banner) => ({ origem: 'painel', ...banner }))
      : BANNER_SLIDES.map((slide) => ({ origem: 'fixo', ...slide }));
  const total = slides.length;
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

  // Autoplay: pausa só com o mouse sobre o link ou com foco de teclado — o banner ocupa
  // boa parte da tela, e pausar com o mouse em qualquer ponto dele fazia parecer que não
  // passava sozinho. Respeita prefers-reduced-motion (não roda nada nesse caso). Depende de
  // indiceAtivo pra recomeçar a contagem quando o cliente troca de banner na mão.
  useEffect(() => {
    if (total <= 1 || pausado || reducedMotionRef.current) return;
    const id = setTimeout(() => {
      setIndiceAtivo((atual) => (atual + 1) % total);
    }, INTERVALO_AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [pausado, total, indiceAtivo]);

  function aoTecla(evento: React.KeyboardEvent) {
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      proximo();
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      anterior();
    }
  }

  const slideAtivo = slides[indiceAtivo];

  return (
    <section className="relative overflow-hidden py-14">
      <div
        ref={regionRef}
        role="region"
        aria-roledescription="carrossel"
        aria-label="Banners promocionais"
        onMouseOver={(evento) => setPausado(!!(evento.target as Element).closest('a'))}
        onMouseLeave={() => setPausado(false)}
        // Só foco de teclado: clicar no botão também deixa o foco nele, e aí o banner
        // ficaria parado até o cliente clicar em outro lugar.
        onFocus={(evento) => {
          if (evento.target.matches(':focus-visible')) setPausado(true);
        }}
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
          Slide {indiceAtivo + 1} de {total}: {rotuloDoSlide(slideAtivo)}
        </p>

        {slides.map((slide, indice) => {
          const ativo = indice === indiceAtivo;
          if (slide.origem === 'painel') {
            return (
              <SlideDoPainel
                key={slide.id}
                banner={slide}
                ativo={ativo}
                indice={indice}
                total={total}
              />
            );
          }
          const palavrasDoTitulo = `${slide.titulo} ${slide.destaque}`.split(' ').length;
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
                  <PalavrasStagger texto={slide.titulo} animar={ativo} stagger={STAGGER_TITULO_S} />{' '}
                  <PalavrasStagger
                    texto={slide.destaque}
                    animar={ativo}
                    atraso={palavrasDoTitulo * STAGGER_TITULO_S}
                    stagger={STAGGER_TITULO_S}
                    classNamePalavra="-mb-[0.15em] bg-clip-text pb-[0.15em] text-transparent"
                    estiloPalavra={estiloDegrade}
                  />
                </h1>
                <p className="mt-4 max-w-md text-[15px] text-muted">
                  <PalavrasStagger
                    texto={slide.texto}
                    animar={ativo}
                    atraso={palavrasDoTitulo * STAGGER_TITULO_S + 0.2}
                    stagger={STAGGER_TEXTO_S}
                  />
                </p>
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

interface SlideDoPainelProps {
  banner: BannerVitrine;
  ativo: boolean;
  indice: number;
  total: number;
}

function SlideDoPainel({ banner, ativo, indice, total }: SlideDoPainelProps) {
  const destino = banner.linkUrl ? destinoDoBanner(banner.linkUrl) : null;
  const propsDoLink = destino && {
    href: destino.href,
    target: destino.externo ? '_blank' : undefined,
    rel: destino.externo ? 'noopener noreferrer' : undefined,
    tabIndex: ativo ? undefined : -1,
  };

  return (
    <div
      aria-roledescription="slide"
      aria-label={`${indice + 1} de ${total}`}
      aria-hidden={!ativo}
      className={[
        'transition-opacity duration-500 motion-reduce:transition-none',
        ativo ? 'relative opacity-100' : 'pointer-events-none absolute inset-0 opacity-0',
      ].join(' ')}
    >
      {banner.imagemUrl ? (
        <div className="relative mx-auto max-w-[1180px] px-5">
          <h1 className="sr-only">{banner.titulo}</h1>
          {(() => {
            const imagem = (
              // A URL vem do painel e pode ser de qualquer site: next/image exigiria liberar cada
              // domínio em remotePatterns. Mesmo motivo da prévia no admin (cupons/page.tsx).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.imagemUrl}
                alt={banner.titulo}
                loading={indice === 0 ? 'eager' : 'lazy'}
                className="aspect-[16/9] w-full rounded-atlas object-cover shadow-atlas nav:aspect-[12/5]"
              />
            );
            return propsDoLink ? (
              <Link {...propsDoLink} className="block rounded-atlas focus-visible:outline-offset-4">
                {imagem}
              </Link>
            ) : (
              imagem
            );
          })()}
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-[1180px] -translate-x-1/2">
            <span
              aria-hidden="true"
              className="animate-blob-float motion-reduce:animate-none absolute -top-[150px] -right-[40px] h-[380px] w-[380px] rounded-full opacity-35 blur-[70px]"
              style={{ background: CORES_SLIDE_PAINEL[0] }}
            />
            <span
              aria-hidden="true"
              className="animate-blob-float motion-reduce:animate-none absolute -bottom-[130px] -left-[60px] h-[300px] w-[300px] rounded-full opacity-35 blur-[70px]"
              style={{ background: CORES_SLIDE_PAINEL[1], animationDelay: '-5s' }}
            />
          </div>
          <div className="relative mx-auto max-w-[1180px] px-5">
            <h1 className="font-display max-w-2xl text-[clamp(32px,4.2vw,54px)] font-bold leading-[1.05] tracking-tight text-navy">
              <PalavrasStagger texto={banner.titulo} animar={ativo} stagger={STAGGER_TITULO_S} />
            </h1>
            {propsDoLink && (
              <Link
                {...propsDoLink}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-[13px] font-bold text-white hover:bg-navy-2"
              >
                Saiba mais →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
