import { listarProdutos } from '@/lib/produtos';
import type { Marca } from '@/lib/marcas';
import { MarcasCarousel } from './MarcasCarousel';

export interface MarcasSectionProps {
  marcas: Marca[];
}

// Carrossel horizontal com setas — cada marca leva pra /marcas/[nome], que lista
// todos os produtos daquela marca agrupados por tipo (mesma CategoryGrid da home).
// A contagem por marca vem do catálogo real, não de um número fixo.
export async function MarcasSection({ marcas }: MarcasSectionProps) {
  const { itens } = await listarProdutos({ pagina: 1, limite: 200 });
  const contagemPorMarca = new Map<string, number>();
  for (const produto of itens) {
    if (!produto.marca) continue;
    contagemPorMarca.set(produto.marca.nome, (contagemPorMarca.get(produto.marca.nome) ?? 0) + 1);
  }

  if (marcas.length === 0) return null;

  const marcasComContagem = marcas.map((marca) => ({
    ...marca,
    quantidade: contagemPorMarca.get(marca.nome) ?? 0,
  }));

  return (
    <section id="marcas" className="mx-auto max-w-[1180px] px-5 py-10">
      <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
        <span className="h-px w-4 bg-blue" aria-hidden="true" />
        Marcas que trabalhamos
      </p>
      <h2 className="mb-6 font-display text-xl font-bold text-navy">
        Clique numa marca e veja tudo que ela tem na loja
      </h2>

      <MarcasCarousel marcas={marcasComContagem} />
    </section>
  );
}
