'use client';

import Link from 'next/link';
import Image from 'next/image';
import { corDaCategoria, iconeDaCategoria } from '@/lib/categoria-visual';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface ProductTypeCardProps {
  slug: string;
  nome: string;
  categoria?: string;
  /** Quantas linhas (marca+embalagem) o tipo tem no total. */
  quantidadeVariantes: number;
  /** Quantas marcas DISTINTAS entre essas variantes — numa página já filtrada por
   * uma marca, isso é sempre 1 mesmo com várias embalagens/aromas da mesma marca. */
  quantidadeMarcas: number;
  precoMinimo: number;
  /** Thumbnail de uma das variantes do grupo (a primeira) — representa o card, se existir. */
  imagemThumbnailUrl?: string;
  indice?: number;
}

// Card "de leque" — quando um tipo de produto (ex: "Detergente para Louça") tem mais
// de uma marca disponível, mostra um card só (sem logo de marca nenhuma, já que
// representa várias) com o menor preço e leva pra página de detalhe, onde dá pra
// escolher a marca/embalagem. Mesmo padrão do site antigo (groupCard).
export function ProductTypeCard({
  slug,
  nome,
  categoria,
  quantidadeVariantes,
  quantidadeMarcas,
  precoMinimo,
  imagemThumbnailUrl,
  indice = 0,
}: ProductTypeCardProps) {
  const corFundo = corDaCategoria(categoria);
  const icone = iconeDaCategoria(categoria);
  const delayMs = Math.min(indice, 7) * 30;

  return (
    <Link
      href={`/produtos/${slug}`}
      className="group @container animate-card-in flex flex-col overflow-hidden rounded-atlas border border-line bg-white shadow-atlas transition-transform hover:-translate-y-1 motion-reduce:animate-none"
      style={{ animationDelay: `${delayMs}ms`, borderTopWidth: 3, borderTopColor: '#2e9bf5' }}
    >
      <div
        className="relative flex aspect-[1.3/1] items-center justify-center overflow-hidden"
        style={{ background: corFundo }}
      >
        <span className="absolute left-2 top-2 z-10 rounded-atlas-sm bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
          {categoria ?? 'produto'}
        </span>
        {imagemThumbnailUrl ? (
          <Image
            src={imagemThumbnailUrl}
            alt={nome}
            fill
            sizes="(min-width: 1024px) 220px, 45vw"
            className="object-contain p-2"
          />
        ) : (
          <span
            className="text-4xl opacity-70 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-115 motion-reduce:transition-none"
            aria-hidden="true"
          >
            {icone}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-[14px] font-semibold leading-snug text-navy">{nome}</p>
        <p className="text-[12px] text-muted">
          {quantidadeMarcas > 1
            ? `${quantidadeMarcas} marcas disponíveis`
            : `${quantidadeVariantes} opções disponíveis`}
        </p>

        {/* flex-wrap: em card estreito com preço longo, o botão desce pra linha de baixo. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 pt-2 @max-[215px]:gap-x-1">
          <span className="flex flex-col">
            <span className="text-[10px] text-muted">a partir de</span>
            <span className="font-mono text-[14px] font-bold text-navy">
              {formatarMoeda(precoMinimo)}
            </span>
          </span>
          <span className="whitespace-nowrap rounded-atlas-sm bg-navy px-2.5 py-1.5 text-[12px] font-semibold text-white @max-[215px]:px-2">
            Ver opções{' '}
            <span
              aria-hidden="true"
              // Em card estreito, a seta é o que faz o botão não caber ao lado do preço.
              className="hidden transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none @[215px]:inline-block"
            >
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
