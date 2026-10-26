import { listarProdutos } from '@/lib/produtos';
import { ProductCard } from './ProductCard';

const QUANTIDADE = 12;
// Estoque/preço/ativo mudam via admin a qualquer momento — revalidate curto.
const REVALIDATE_SEGUNDOS = 120;

export async function PromocoesSection() {
  let itens;
  try {
    const resultado = await listarProdutos(
      { pagina: 1, limite: QUANTIDADE, emPromocao: true },
      { next: { revalidate: REVALIDATE_SEGUNDOS } },
    );
    itens = resultado.itens;
  } catch {
    // Isolado: se /produtos falhar aqui, some só essa seção — o resto da home segue.
    return null;
  }

  // Sem produto em promoção agora — nada de grid vazio na home.
  if (itens.length === 0) return null;

  return (
    <section aria-label="Promoções" className="mx-auto max-w-[1180px] px-5 py-10">
      <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
        <span className="h-px w-4 bg-blue" aria-hidden="true" />
        Por tempo limitado
      </p>
      <h2 className="mb-6 font-display text-xl font-bold text-navy">Promoções</h2>
      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}
      >
        {itens.map((produto, indice) => (
          <ProductCard key={produto.id} produto={produto} indice={indice} />
        ))}
      </div>
    </section>
  );
}
