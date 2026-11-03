import { listarProdutos } from '@/lib/produtos';
import { CategoriaCabecalho } from './CategoriaCabecalho';
import { CategoryGrid } from './CategoryGrid';

const NOMES: Record<string, string> = {
  limpeza: 'Limpeza',
  descartaveis: 'Descartáveis',
  papelaria: 'Papelaria',
};

// Estoque/preço/ativo mudam via admin a qualquer momento — revalidate curto.
const REVALIDATE_SEGUNDOS = 120;

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
  let itens, total;
  try {
    const resultado = await listarProdutos(
      { pagina: 1, limite: 200, categoria },
      { next: { revalidate: REVALIDATE_SEGUNDOS } },
    );
    itens = resultado.itens;
    total = resultado.total;
  } catch {
    // Isolado: se /produtos falhar pra essa categoria, some só esse bloco — o resto da home segue.
    return null;
  }

  return (
    <section id={categoria} className="relative mx-auto max-w-[1180px] px-5 py-10">
      <CategoriaCabecalho
        nome={NOMES[categoria]}
        numero={numero}
        indice={indice}
        totalCategorias={totalCategorias}
        totalProdutos={total}
      />
      <div className="relative">
        <CategoryGrid produtos={itens} />
      </div>
    </section>
  );
}
