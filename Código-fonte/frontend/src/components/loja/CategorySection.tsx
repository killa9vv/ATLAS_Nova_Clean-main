import { listarProdutos } from '@/lib/produtos';
import { CategoryGrid } from './CategoryGrid';

const NOMES: Record<string, string> = {
  limpeza: 'Limpeza',
  descartaveis: 'Descartáveis',
  papelaria: 'Papelaria',
};

export interface CategorySectionProps {
  categoria: 'limpeza' | 'descartaveis' | 'papelaria';
  numero: string;
  indice: number;
  total: number;
}

export async function CategorySection({
  categoria,
  numero,
  indice,
  total: totalCategorias,
}: CategorySectionProps) {
  const { itens, total } = await listarProdutos({ pagina: 1, limite: 200, categoria });

  return (
    <section id={categoria} className="relative mx-auto max-w-[1180px] px-5 py-10">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-[46px] left-[-6px] z-0 select-none font-display text-[96px] font-bold leading-none text-navy/5"
      >
        {numero}
      </span>
      <div className="relative z-10 mb-5">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
          Categoria {indice} de {totalCategorias}
        </p>
        <h2 className="font-display text-2xl font-bold text-navy">{NOMES[categoria]}</h2>
        <p className="text-[13px] text-muted">{total} produtos</p>
      </div>
      <div className="relative">
        <CategoryGrid produtos={itens} />
      </div>
    </section>
  );
}
