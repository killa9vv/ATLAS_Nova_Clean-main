import Link from 'next/link';
import { listarCategorias } from '@/lib/categorias';
import { corDaCategoria, iconeDaCategoria } from '@/lib/categoria-visual';

// Categorias mudam raramente (cadastro manual do admin) — revalidate mais longo.
const REVALIDATE_SEGUNDOS = 3600;

export async function CategoriaAtalhos() {
  let categorias;
  try {
    categorias = await listarCategorias(
      { ativo: true },
      { next: { revalidate: REVALIDATE_SEGUNDOS } },
    );
  } catch {
    // Isolado: se /categorias falhar, some só esse bloco — o resto da home segue.
    return null;
  }

  if (categorias.length === 0) return null;

  return (
    <section aria-label="Atalhos por categoria" className="mx-auto max-w-[1180px] px-5 py-8">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}
      >
        {categorias.map((categoria) => (
          <Link
            key={categoria.id}
            href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
            className="group flex items-center gap-3.5 rounded-atlas border border-line bg-white p-4 shadow-atlas transition-transform hover:-translate-y-0.5"
            style={{ borderLeft: `5px solid ${corDaCategoria(categoria.slug)}` }}
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
              style={{ background: corDaCategoria(categoria.slug) }}
              aria-hidden="true"
            >
              {iconeDaCategoria(categoria.slug)}
            </span>
            <span className="flex-1">
              <span className="block text-[14px] font-bold text-navy">{categoria.nome}</span>
              <span className="text-[12px] font-semibold text-blue">Ver produtos →</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
