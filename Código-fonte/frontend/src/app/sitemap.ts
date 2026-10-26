import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { listarProdutos } from '@/lib/produtos';
import { listarMarcas } from '@/lib/marcas';

// Revalida de hora em hora — catálogo/marcas mudam pelo admin a qualquer momento,
// mas o sitemap não precisa refletir isso em tempo real (mesmo padrão de
// REVALIDATE_SEGUNDOS já usado em MarcasSection/CategorySection).
export const revalidate = 3600;

const PAGINAS_ESTATICAS = [
  '',
  '/catalogo',
  '/politica-entrega',
  '/politica-devolucao',
  '/politica-privacidade',
  '/termos-condicoes',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = PAGINAS_ESTATICAS.map((caminho) => ({
    url: `${SITE_URL}${caminho}`,
  }));

  try {
    const [marcas, { itens: produtos }] = await Promise.all([
      listarMarcas({ next: { revalidate } }),
      listarProdutos({ pagina: 1, limite: 200 }, { next: { revalidate } }),
    ]);

    const slugsDeTipo = new Set<string>();
    for (const produto of produtos) {
      if (produto.produtoTipo) slugsDeTipo.add(produto.produtoTipo.slug);
    }

    const paginasDeProduto: MetadataRoute.Sitemap = [...slugsDeTipo].map((slug) => ({
      url: `${SITE_URL}/produtos/${slug}`,
    }));

    const paginasDeMarca: MetadataRoute.Sitemap = marcas.map((marca) => ({
      url: `${SITE_URL}/marcas/${encodeURIComponent(marca.nome)}`,
    }));

    return [...estaticas, ...paginasDeProduto, ...paginasDeMarca];
  } catch {
    // Backend fora do ar não pode derrubar o sitemap inteiro — degrada pras
    // páginas estáticas, que não dependem da API.
    return estaticas;
  }
}
