'use client';

import { PalavrasStagger } from '@/components/ui/PalavrasStagger';
import { useContagemAnimada } from '@/hooks/use-contagem-animada';
import { useEntradaNaTela } from '@/hooks/use-entrada-na-tela';

function formatarContagem(numero: number): string {
  return String(Math.round(numero));
}

export interface CategoriaCabecalhoProps {
  nome: string;
  numero: string;
  indice: number;
  totalCategorias: number;
  totalProdutos: number;
}

export function CategoriaCabecalho({
  nome,
  numero,
  indice,
  totalCategorias,
  totalProdutos,
}: CategoriaCabecalhoProps) {
  const { ref, entrada } = useEntradaNaTela<HTMLDivElement>();
  const entrando = entrada === 'entrando';
  const contagemRef = useContagemAnimada<HTMLSpanElement>(
    entrando,
    totalProdutos,
    formatarContagem,
  );
  const classeEscondido = entrada === 'aguardando' ? 'opacity-0' : '';

  return (
    <div ref={ref}>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-[46px] left-[-6px] z-0 select-none font-display text-[96px] font-bold leading-none text-navy/5 ${classeEscondido} ${entrando ? 'palavra-stagger' : ''}`}
      >
        {numero}
      </span>
      <div className={`relative z-10 mb-5 ${classeEscondido}`}>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
          Categoria {indice} de {totalCategorias}
        </p>
        <h2 className="font-display text-2xl font-bold text-navy">
          <PalavrasStagger texto={nome} animar={entrando} />
        </h2>
        <p className="text-[13px] tabular-nums text-muted">
          <span ref={contagemRef}>{totalProdutos}</span> produtos
        </p>
      </div>
    </div>
  );
}
