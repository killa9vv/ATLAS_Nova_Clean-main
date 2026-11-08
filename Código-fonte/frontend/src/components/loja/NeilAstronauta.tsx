import { useId } from 'react';

const COR_TRAJE = '#ffffff';
const COR_CONTORNO = '#c3d4ec';
const COR_MOCHILA = '#a9bfe0';
const COR_DETALHE = '#1565c0';
const COR_BOTA = '#0b1f4d';
const COR_ANTENA = '#1faa59';

export interface NeilAstronautaProps {
  /** `corpo` é o mascote inteiro, acenando; `cabeca` é o recorte do capacete, pra avatar. */
  variante?: 'corpo' | 'cabeca';
  /** Largura em px. A altura acompanha a proporção do desenho. */
  tamanho: number;
  className?: string;
}

// Mascote do chat. Um astronauta de desenho, sem traços de ninguém: o nome é só o nome do
// personagem. Decorativo: quem usa dá o rótulo pro elemento em volta.
export function NeilAstronauta({ variante = 'corpo', tamanho, className }: NeilAstronautaProps) {
  const idVisor = useId();
  const ehCorpo = variante === 'corpo';
  const [largura, altura] = ehCorpo ? [80, 92] : [54, 54];

  return (
    <svg
      aria-hidden="true"
      width={tamanho}
      height={(tamanho * altura) / largura}
      viewBox={ehCorpo ? '0 0 80 92' : '13 0 54 54'}
      className={className}
    >
      <defs>
        <linearGradient id={idVisor} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b1f4d" />
          <stop offset="1" stopColor="#1565c0" />
        </linearGradient>
      </defs>

      {ehCorpo && (
        <>
          <rect x="21" y="45" width="38" height="25" rx="6" fill={COR_MOCHILA} />
          <path
            d="M34 70 32 83M46 70l2 13"
            stroke={COR_CONTORNO}
            strokeWidth="9.5"
            strokeLinecap="round"
          />
          <path
            d="M34 70 32 83M46 70l2 13"
            stroke={COR_TRAJE}
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          <rect x="26" y="82" width="12" height="7" rx="3" fill={COR_BOTA} />
          <rect x="42" y="82" width="12" height="7" rx="3" fill={COR_BOTA} />
          <path d="M28 51 17 63" stroke={COR_CONTORNO} strokeWidth="9.5" strokeLinecap="round" />
          <path d="M28 51 17 63" stroke={COR_TRAJE} strokeWidth="7.5" strokeLinecap="round" />
          <circle cx="16" cy="64" r="4.5" fill={COR_DETALHE} />
          <rect
            x="26"
            y="45"
            width="28"
            height="28"
            rx="9"
            fill={COR_TRAJE}
            stroke={COR_CONTORNO}
            strokeWidth="1.2"
          />
          <rect x="33" y="54" width="14" height="10" rx="2.5" fill={COR_BOTA} />
          <circle cx="37" cy="59" r="1.6" fill={COR_ANTENA} />
          <circle cx="43" cy="59" r="1.6" fill="#f5a623" />
          <g className="neil-aceno">
            <path d="M52 51 65 38" stroke={COR_CONTORNO} strokeWidth="9.5" strokeLinecap="round" />
            <path d="M52 51 65 38" stroke={COR_TRAJE} strokeWidth="7.5" strokeLinecap="round" />
            <circle cx="66" cy="37" r="4.5" fill={COR_DETALHE} />
          </g>
        </>
      )}

      <rect x="30" y="43" width="20" height="6" rx="3" fill={COR_DETALHE} />
      <path d="M52 12 56 5" stroke={COR_CONTORNO} strokeWidth="2" strokeLinecap="round" />
      <circle className="neil-antena" cx="56.5" cy="4" r="2.4" fill={COR_ANTENA} />
      <rect x="16.5" y="20" width="6" height="13" rx="2.5" fill={COR_DETALHE} />
      <rect x="57.5" y="20" width="6" height="13" rx="2.5" fill={COR_DETALHE} />
      <circle cx="40" cy="26" r="20" fill={COR_TRAJE} stroke={COR_CONTORNO} strokeWidth="1.2" />
      <rect x="25" y="15" width="30" height="23" rx="11.5" fill={`url(#${idVisor})`} />
      <path
        d="M29 25c0-4 3-7 7-7"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="35" cy="26" rx="2" ry="2.7" fill="#ffffff" />
      <ellipse cx="45" cy="26" rx="2" ry="2.7" fill="#ffffff" />
      <path
        d="M35.5 31.5q4.5 3.6 9 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
