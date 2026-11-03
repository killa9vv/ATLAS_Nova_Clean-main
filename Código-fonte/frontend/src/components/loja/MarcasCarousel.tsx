'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogosCarousel } from '@/components/ui/LogosCarousel';
import { useMenosMovimento } from '@/hooks/use-menos-movimento';

export interface MarcaComContagem {
  id: string;
  nome: string;
  imagemUrl?: string;
  quantidade: number;
}

export interface MarcasCarouselProps {
  marcas: MarcaComContagem[];
}

const MARCAS_POR_GRUPO = 6;
// Uma linha no desktop; no celular os 6 quebram em 2 linhas de 3, sem JS.
const CLASSES_GRUPO = 'flex-wrap gap-x-4 gap-y-5 sm:gap-x-10';

function LogoMarca({ marca }: { marca: MarcaComContagem }) {
  return (
    <Link
      href={`/marcas/${encodeURIComponent(marca.nome)}`}
      className="flex w-24 flex-col items-center gap-1.5 text-center transition-transform hover:-translate-y-1"
    >
      <span className="relative flex h-16 w-24 items-center justify-center">
        {marca.imagemUrl ? (
          <Image
            src={marca.imagemUrl}
            alt={marca.nome}
            fill
            sizes="96px"
            // Vários logos têm fundo branco: sem isso, viram um retângulo na página.
            className="object-contain mix-blend-multiply"
          />
        ) : (
          <span className="text-[13px] font-bold text-navy">{marca.nome}</span>
        )}
      </span>
      <span className="text-[11px] text-muted">
        {marca.quantidade} {marca.quantidade === 1 ? 'produto' : 'produtos'}
      </span>
    </Link>
  );
}

// O carrossel mostra poucas marcas por vez e não tem setas, e o site não tem uma página
// com a lista de marcas: "Ver todas" garante que nenhuma fique inalcançável. Quem pede
// menos movimento no sistema já recebe a lista direto, sem animação.
export function MarcasCarousel({ marcas }: MarcasCarouselProps) {
  const [verTodas, setVerTodas] = useState(false);
  const menosMovimento = useMenosMovimento();

  if (menosMovimento || verTodas) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className={`flex justify-center ${CLASSES_GRUPO}`}>
          {marcas.map((marca) => (
            <LogoMarca key={marca.id} marca={marca} />
          ))}
        </div>
        {!menosMovimento && (
          <button
            type="button"
            onClick={() => setVerTodas(false)}
            className="text-[13px] font-semibold text-blue hover:underline"
          >
            Ver menos
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <LogosCarousel count={MARCAS_POR_GRUPO} className={CLASSES_GRUPO}>
        {marcas.map((marca) => (
          <LogoMarca key={marca.id} marca={marca} />
        ))}
      </LogosCarousel>
      {marcas.length > MARCAS_POR_GRUPO && (
        <button
          type="button"
          onClick={() => setVerTodas(true)}
          className="text-[13px] font-semibold text-blue hover:underline"
        >
          Ver todas as marcas
        </button>
      )}
    </div>
  );
}
