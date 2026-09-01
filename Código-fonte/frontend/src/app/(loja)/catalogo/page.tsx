import { listarProdutos } from '@/lib/produtos';
import { CategoryGrid } from '@/components/loja/CategoryGrid';

// Destino da busca do header (form action="/catalogo", input name="q") e também a
// vitrine completa (sem filtro de categoria) — mesmo CategoryGrid da Home, pra não
// ter duas experiências de navegação diferentes pro mesmo catálogo.
export const dynamic = 'force-dynamic';

export default async function CatalogoPage({ searchParams }: PageProps<'/catalogo'>) {
  const { q } = await searchParams;
  const busca = typeof q === 'string' && q.trim() ? q.trim() : undefined;
  const { itens, total } = await listarProdutos({ pagina: 1, limite: 200, busca });

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10">
      <h1 className="mb-1 font-display text-2xl font-bold text-navy">
        {busca ? `Resultados para "${busca}"` : 'Catálogo completo'}
      </h1>
      <p className="mb-6 text-[13px] text-muted">{total} produtos</p>
      <CategoryGrid produtos={itens} />
    </main>
  );
}
