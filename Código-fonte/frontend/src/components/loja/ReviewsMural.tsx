'use client';

import { useState } from 'react';
import { COR_POR_CATEGORIA } from '@/lib/categoria-visual';
import type { Resenha } from '@/lib/resenhas';

// Abaixo disso as colunas não enchem a altura do mural e sobraria um buraco no meio da rolagem.
const MINIMO_PARA_ROLAR = 8;
const SEGUNDOS_POR_RECADO = 14;
const INCLINACOES_GRAUS = [-1, 0.8, -0.5, 1.2];
const CORES_AVATAR = Object.values(COR_POR_CATEGORIA);

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function corDoAvatar(nome: string): string {
  const soma = [...nome].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return CORES_AVATAR[soma % CORES_AVATAR.length];
}

function Estrelas({ nota, tamanho = 'text-sm' }: { nota: number; tamanho?: string }) {
  return (
    <span className={tamanho} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < nota ? 'text-amber' : 'text-line'}>
          ★
        </span>
      ))}
    </span>
  );
}

export interface BolhaRecadoProps {
  nome: string;
  nota: number;
  comentario: string;
  /** Sem data, é a prévia de quem ainda está escrevendo. */
  data?: string;
  indice?: number;
  className?: string;
}

export function BolhaRecado({
  nome,
  nota,
  comentario,
  data,
  indice = 0,
  className = '',
}: BolhaRecadoProps) {
  return (
    <article className={className}>
      <div
        className="relative rounded-2xl border border-line bg-white p-4 shadow-atlas transition-[rotate,translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:rotate-0 hover:shadow-atlas-lg motion-reduce:transition-none"
        style={{ rotate: `${INCLINACOES_GRAUS[indice % INCLINACOES_GRAUS.length]}deg` }}
      >
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2.5">
          <Estrelas nota={nota} />
          {data && <span className="font-mono text-[11px] text-muted">{formatarData(data)}</span>}
        </div>
        <p className="whitespace-pre-line break-words text-[13px] leading-[1.55] text-ink">
          {comentario}
        </p>
        {/* Biquinho do balão, apontando pro avatar. */}
        <span
          aria-hidden="true"
          className="absolute -bottom-[7px] left-5 h-3 w-3 rotate-45 border-b border-r border-line bg-white"
        />
      </div>
      <div className="mt-2.5 flex items-center gap-2 pl-2.5">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold uppercase text-navy"
          style={{ background: corDoAvatar(nome) }}
        >
          {nome.charAt(0)}
        </span>
        <span className="min-w-0 truncate text-[13px] font-bold text-navy">{nome}</span>
      </div>
    </article>
  );
}

// Inspirado em @spell/marquee (spell.sh), só com CSS (.mural-coluna em globals.css). Rolando
// só com muitos recados e, nessa hora, com botão de pausar: texto pra ler não pode se mexer
// sem dar controle a quem lê. No celular, em vez de mover sozinho, o cliente arrasta.
export function MuralResenhas({ resenhas }: { resenhas: Resenha[] }) {
  const [pausado, setPausado] = useState(false);

  if (resenhas.length < MINIMO_PARA_ROLAR) {
    return (
      <div className="columns-1 gap-3.5 sm:columns-2">
        {resenhas.map((resenha, indice) => (
          <BolhaRecado
            key={resenha.id}
            nome={resenha.nome}
            nota={resenha.nota}
            comentario={resenha.comentario}
            data={resenha.createdAt}
            indice={indice}
            className="mb-5 break-inside-avoid px-1"
          />
        ))}
      </div>
    );
  }

  const colunas = [
    resenhas.filter((_, indice) => indice % 2 === 0),
    resenhas.filter((_, indice) => indice % 2 === 1),
  ];
  const duracao = `${colunas[0].length * SEGUNDOS_POR_RECADO}s`;
  const mascara =
    'linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)';

  return (
    <>
      <div
        className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-1 pb-3 pt-1 sm:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {resenhas.map((resenha, indice) => (
          <BolhaRecado
            key={resenha.id}
            nome={resenha.nome}
            nota={resenha.nota}
            comentario={resenha.comentario}
            data={resenha.createdAt}
            indice={indice}
            className="w-[82%] shrink-0 snap-center"
          />
        ))}
      </div>

      <div className="hidden sm:block">
        <div
          className="group/mural grid h-[520px] grid-cols-2 gap-3.5 overflow-hidden motion-reduce:overflow-y-auto"
          style={{ maskImage: mascara, WebkitMaskImage: mascara }}
        >
          {colunas.map((coluna, indiceColuna) => (
            <div key={indiceColuna} className="min-w-0">
              <div
                className={`mural-coluna group-hover/mural:[animation-play-state:paused] ${pausado ? '[animation-play-state:paused]' : ''}`}
                style={{
                  animationDuration: duracao,
                  animationDirection: indiceColuna === 1 ? 'reverse' : undefined,
                }}
              >
                {[false, true].map((copia) => (
                  // A cópia só existe pra emendar a rolagem: fora do leitor de tela e, sem
                  // animação, fora da tela (senão os recados apareceriam repetidos).
                  <div
                    key={String(copia)}
                    aria-hidden={copia || undefined}
                    className={copia ? 'motion-reduce:hidden' : undefined}
                  >
                    {coluna.map((resenha, indice) => (
                      <BolhaRecado
                        key={resenha.id}
                        nome={resenha.nome}
                        nota={resenha.nota}
                        comentario={resenha.comentario}
                        data={resenha.createdAt}
                        indice={indice + indiceColuna}
                        className="px-1.5 pb-5 pt-1"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={pausado}
          onClick={() => setPausado((atual) => !atual)}
          className="mt-2 text-[12px] font-semibold text-blue hover:underline motion-reduce:hidden"
        >
          {pausado ? 'Continuar rolagem' : 'Pausar rolagem'}
        </button>
      </div>
    </>
  );
}
