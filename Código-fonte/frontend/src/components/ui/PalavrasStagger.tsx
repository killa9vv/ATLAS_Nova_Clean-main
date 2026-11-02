import type { CSSProperties } from 'react';

export interface PalavrasStaggerProps {
  texto: string;
  /** Liga a animação; trocar pra true de novo faz ela recomeçar (slide que volta a aparecer). */
  animar: boolean;
  /** Espera antes da primeira palavra, em segundos. */
  atraso?: number;
  /** Espera entre uma palavra e a próxima, em segundos. */
  stagger?: number;
  classNamePalavra?: string;
  estiloPalavra?: (indice: number, total: number) => CSSProperties;
}

// Mesmo efeito de @spell/words-stagger (spell.sh), só com CSS (.palavra-stagger em
// globals.css) em vez da biblioteca motion: não pesa na home e funciona antes do JS
// carregar. Os espaços ficam fora das palavras pro texto seguir normal pra leitor de tela,
// busca e copiar/colar.
export function PalavrasStagger({
  texto,
  animar,
  atraso = 0,
  stagger = 0.1,
  classNamePalavra = '',
  estiloPalavra,
}: PalavrasStaggerProps) {
  const palavras = texto.split(' ').filter(Boolean);

  return (
    <>
      {palavras.map((palavra, indice) => (
        <span key={`${palavra}-${indice}`}>
          <span
            className={`inline-block ${animar ? 'palavra-stagger' : ''} ${classNamePalavra}`}
            style={{
              animationDelay: `${atraso + indice * stagger}s`,
              ...estiloPalavra?.(indice, palavras.length),
            }}
          >
            {palavra}
          </span>
          {indice < palavras.length - 1 && ' '}
        </span>
      ))}
    </>
  );
}
