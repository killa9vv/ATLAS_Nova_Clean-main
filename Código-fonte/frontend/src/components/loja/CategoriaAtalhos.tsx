import Link from 'next/link';
import { listarCategorias } from '@/lib/categorias';
import { corDaCategoria, iconeDaCategoria } from '@/lib/categoria-visual';
import { TiltCard } from '@/components/ui/TiltCard';

// Categorias mudam raramente (cadastro manual do admin) — revalidate mais longo.
const REVALIDATE_SEGUNDOS = 3600;

export async function CategoriaAtalhos() {
  let categorias;
  try {
    categorias = await listarCategorias({ next: { revalidate: REVALIDATE_SEGUNDOS } });
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
        {categorias.map((categoria, indice) => (
          // A entrada fica fora do TiltCard: animate-card-in termina segurando um transform,
          // que anularia a inclinação se os dois estivessem no mesmo elemento.
          <div
            key={categoria.id}
            className="animate-card-in motion-reduce:animate-none"
            style={{ animationDelay: `${indice * 90}ms` }}
          >
            <TiltCard corBrilho={corDaCategoria(categoria.slug)} className="h-full rounded-atlas">
              <Link
                href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                className="group flex h-full items-center gap-3.5 rounded-atlas border border-line bg-white p-4 shadow-atlas transition-[scale,box-shadow] duration-200 hover:shadow-atlas-lg active:scale-[0.98] motion-reduce:transition-none"
                style={{ borderLeft: `5px solid ${corDaCategoria(categoria.slug)}` }}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-115 group-focus-visible:-rotate-6 group-focus-visible:scale-115 motion-reduce:transition-none"
                  style={{ background: corDaCategoria(categoria.slug) }}
                  aria-hidden="true"
                >
                  {iconeDaCategoria(categoria.slug)}
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] font-bold text-navy">{categoria.nome}</span>
                  <span className="text-[12px] font-semibold text-blue">
                    Ver produtos{' '}
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
                    >
                      →
                    </span>
                  </span>
                </span>
              </Link>
            </TiltCard>
          </div>
        ))}
      </div>
    </section>
  );
}
