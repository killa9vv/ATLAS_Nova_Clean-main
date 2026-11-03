'use client';

import Image from 'next/image';
import Link from 'next/link';
import { StatusLoja } from '@/components/layout/StatusLoja';
import { LogosCarousel } from '@/components/ui/LogosCarousel';
import { PalavrasStagger } from '@/components/ui/PalavrasStagger';
import { useContagemAnimada } from '@/hooks/use-contagem-animada';
import { useEntradaNaTela, type EntradaNaTela } from '@/hooks/use-entrada-na-tela';
import { useMenosMovimento } from '@/hooks/use-menos-movimento';
import { hrefWhatsApp } from '@/lib/whatsapp';

const LOGOS_POR_GRUPO = 6;
// As mais conhecidas abrem o carrossel, se estiverem cadastradas.
const MARCAS_EM_DESTAQUE = ['Ypê', 'Veja', 'OMO', 'Downy'];
const ENDERECO = 'Av. Arthur Bernardes, 619 — Campos dos Goytacazes, RJ';
const PASSOS_WHATSAPP = ['Monte sua lista', 'Mande no WhatsApp', 'A gente confirma tudo por lá'];
const ATRASO_ENTRE_CARDS_MS = 120;

export interface CategoriaContada {
  nome: string;
  total: number;
}

export interface MarcaResumida {
  id: string;
  nome: string;
  imagemUrl?: string;
}

function formatarContagem(numero: number): string {
  return String(Math.round(numero));
}

function Numero({ valor, entrando }: { valor: number; entrando: boolean }) {
  const ref = useContagemAnimada<HTMLSpanElement>(entrando, valor, formatarContagem);
  return <span ref={ref}>{valor}</span>;
}

function ProvaCatalogo({
  categorias,
  entrada,
}: {
  categorias: CategoriaContada[];
  entrada: EntradaNaTela;
}) {
  const total = categorias.reduce((soma, categoria) => soma + categoria.total, 0);
  if (total === 0) return null;

  return (
    <div className="mb-5">
      <p className="flex items-baseline gap-2">
        <span className="font-display text-[44px] font-bold leading-none">
          <Numero valor={total} entrando={entrada === 'entrando'} />
        </span>
        <span className="text-[13px] text-sky/90">produtos no catálogo</span>
      </p>
      <ul className="mt-4 flex list-none flex-col gap-2 p-0">
        {categorias.map((categoria, indice) => (
          <li key={categoria.nome}>
            <span className="mb-1 flex justify-between text-[12px] text-sky/90">
              <span>{categoria.nome}</span>
              <span className="font-mono tabular-nums">
                <Numero valor={categoria.total} entrando={entrada === 'entrando'} />
              </span>
            </span>
            <span
              className="block h-1.5 overflow-hidden rounded-full bg-white/15"
              aria-hidden="true"
            >
              <span
                className="block h-full origin-left rounded-full bg-[#6cb6f7] transition-transform duration-700 ease-out motion-reduce:transition-none"
                style={{
                  transform: `scaleX(${entrada === 'aguardando' ? 0 : categoria.total / total})`,
                  transitionDelay: `${250 + indice * 120}ms`,
                }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProvaWhatsApp({ entrada }: { entrada: EntradaNaTela }) {
  return (
    <div className="mb-5">
      <ol className="flex list-none flex-col p-0">
        {PASSOS_WHATSAPP.map((passo, indice) => {
          const atraso = `${350 + indice * 450}ms`;
          return (
            <li key={passo} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-300 motion-reduce:transition-none ${
                    entrada === 'aguardando' ? 'bg-line' : 'bg-[#14753c]'
                  }`}
                  style={{ transitionDelay: atraso }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={entrada === 'entrando' ? 'estrela-pop' : ''}
                    style={{ animationDelay: atraso }}
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {indice < PASSOS_WHATSAPP.length - 1 && (
                  <span className="h-5 w-0.5 overflow-hidden bg-line" aria-hidden="true">
                    <span
                      className="block h-full origin-top bg-[#14753c] transition-transform duration-300 motion-reduce:transition-none"
                      style={{
                        transform: `scaleY(${entrada === 'aguardando' ? 0 : 1})`,
                        transitionDelay: `${500 + indice * 450}ms`,
                      }}
                    />
                  </span>
                )}
              </span>
              <span className="pt-1 text-[13.5px] font-semibold text-navy">{passo}</span>
            </li>
          );
        })}
      </ol>
      <a
        href={hrefWhatsApp('Olá, quero fazer um pedido')}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-3 inline-flex items-center gap-1 py-1 text-[13px] font-bold text-[#14753c] hover:underline"
      >
        Fazer meu pedido
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
        >
          →
        </span>
      </a>
    </div>
  );
}

function LogoMarca({ marca }: { marca: MarcaResumida }) {
  return (
    <Link
      href={`/marcas/${encodeURIComponent(marca.nome)}`}
      className="relative flex h-11 w-[72px] items-center justify-center transition-transform duration-200 hover:scale-110 motion-reduce:transition-none"
    >
      {marca.imagemUrl ? (
        <Image
          src={marca.imagemUrl}
          alt={marca.nome}
          fill
          sizes="72px"
          className="object-contain"
        />
      ) : (
        <span className="text-[12px] font-bold text-navy">{marca.nome}</span>
      )}
    </Link>
  );
}

function ProvaMarcas({ marcas, entrada }: { marcas: MarcaResumida[]; entrada: EntradaNaTela }) {
  const menosMovimento = useMenosMovimento();
  if (marcas.length === 0) return null;

  const ordenadas = [
    ...MARCAS_EM_DESTAQUE.flatMap((nome) => marcas.filter((marca) => marca.nome === nome)),
    ...marcas.filter((marca) => !MARCAS_EM_DESTAQUE.includes(marca.nome)),
  ];
  // Sem animação, um grupo fixo: a lista completa está em "Ver todas".
  const logos = (menosMovimento ? ordenadas.slice(0, LOGOS_POR_GRUPO) : ordenadas).map((marca) => (
    <LogoMarca key={marca.id} marca={marca} />
  ));

  return (
    <div className="mb-5">
      <p className="flex items-baseline gap-2">
        <span className="font-display text-[44px] font-bold leading-none text-navy">
          <Numero valor={marcas.length} entrando={entrada === 'entrando'} />
        </span>
        <span className="text-[13px] text-muted">marcas na loja</span>
      </p>
      {/* overflow-hidden: na troca, os logos sobem e descem 40px e invadiriam o texto em volta. */}
      <div className="mt-3 overflow-hidden py-1">
        {menosMovimento ? (
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-3">{logos}</div>
        ) : (
          <LogosCarousel
            count={LOGOS_POR_GRUPO}
            className="flex-wrap gap-x-3 gap-y-3"
            interval={3000}
          >
            {logos}
          </LogosCarousel>
        )}
      </div>
      <a
        href="#marcas"
        className="group mt-3 inline-flex items-center gap-1 py-1 text-[13px] font-bold text-blue hover:underline"
      >
        Ver todas
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
        >
          →
        </span>
      </a>
    </div>
  );
}

export interface ValuePropsProvasProps {
  categorias: CategoriaContada[];
  marcas: MarcaResumida[];
}

export function ValuePropsProvas({ categorias, marcas }: ValuePropsProvasProps) {
  const { ref, entrada } = useEntradaNaTela<HTMLElement>(0.1);
  const classeEntrada =
    entrada === 'aguardando' ? 'opacity-0' : entrada === 'entrando' ? 'animate-card-in' : '';
  const classeCard = `flex flex-col rounded-atlas p-6 shadow-atlas ${classeEntrada}`;

  return (
    <section ref={ref} id="sobre" className="mx-auto max-w-[1180px] scroll-mt-20 px-5 py-14">
      <h2
        className={`mb-6 text-center font-display text-2xl font-bold text-navy ${entrada === 'aguardando' ? 'opacity-0' : ''}`}
      >
        <PalavrasStagger
          texto="Por que comprar na Atlas Nova Clean"
          animar={entrada === 'entrando'}
          stagger={0.06}
        />
      </h2>

      <div className="grid gap-4 nav:grid-cols-3">
        <div className={`${classeCard} bg-navy text-white`}>
          <ProvaCatalogo categorias={categorias} entrada={entrada} />
          <h3 className="mb-1.5 mt-auto font-display text-lg font-bold">Atacado e varejo</h3>
          <p className="text-[13.5px] text-sky/90">
            Compre em quantidade pro seu comércio ou só o que precisa pra casa — mesmo preço justo
            dos dois jeitos.
          </p>
        </div>

        <div
          className={`${classeCard} border border-line bg-white text-navy`}
          style={{ animationDelay: `${ATRASO_ENTRE_CARDS_MS}ms` }}
        >
          <ProvaWhatsApp entrada={entrada} />
          <h3 className="mb-1.5 mt-auto font-display text-lg font-bold">Pedido no WhatsApp</h3>
          <p className="text-[13.5px] text-muted">
            Manda sua lista e a gente confirma tudo por lá, sem complicação.
          </p>
        </div>

        <div
          className={`${classeCard} border border-line bg-white text-navy`}
          style={{ animationDelay: `${ATRASO_ENTRE_CARDS_MS * 2}ms` }}
        >
          <ProvaMarcas marcas={marcas} entrada={entrada} />
          <h3 className="mb-1.5 mt-auto font-display text-lg font-bold">Marcas confiáveis</h3>
          <p className="text-[13.5px] text-muted">
            Ypê, Veja, OMO, Downy e outras marcas que você já conhece e confia.
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-atlas border border-line bg-white px-6 py-4 shadow-atlas ${classeEntrada}`}
        style={{ animationDelay: `${ATRASO_ENTRE_CARDS_MS * 3}ms` }}
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-bold text-navy [&>span]:ml-0">
            Loja física em Campos, com retirada no local
            <StatusLoja />
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {ENDERECO}. Segunda a sábado, das 8h às 18h.
          </p>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 py-1 text-[13px] font-bold text-blue hover:underline"
        >
          Ver no mapa
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
          >
            →
          </span>
        </a>
      </div>
    </section>
  );
}
