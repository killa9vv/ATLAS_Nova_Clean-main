import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listarProdutos, listarImagensProduto, type Produto } from '@/lib/produtos';
import { ProdutoDetalhe } from '@/components/loja/ProdutoDetalhe';
import { ProdutosRelacionados } from '@/components/loja/produto/ProdutosRelacionados';
import { JsonLd } from '@/components/JsonLd';
import { SITE_URL } from '@/lib/site';

// Estoque/preço/promoção mudam via admin a qualquer momento — revalidate curto,
// mesmo padrão usado nas outras seções de produtos (Home/Catálogo). O slug é do
// ProdutoTipo (agrupador de marca/embalagem), não do Produto individual — decisão
// já documentada no schema (ver ProdutoTipo.slug) e mantida deliberadamente: a
// página mostra um seletor de variantes em vez de uma URL por SKU.
const REVALIDATE_SEGUNDOS = 120;

async function buscarVariantes(slug: string) {
  const { itens } = await listarProdutos(
    { pagina: 1, limite: 50, produtoTipoSlug: slug },
    { next: { revalidate: REVALIDATE_SEGUNDOS } },
  );
  return itens;
}

export async function generateMetadata({
  params,
}: PageProps<'/produtos/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const variantes = await buscarVariantes(slug);

  if (variantes.length === 0) {
    return { title: 'Produto não encontrado' };
  }

  const principal = variantes[0];
  const titulo = principal.produtoTipo?.nome ?? principal.nome;
  const descricao =
    principal.descricao ??
    principal.produtoTipo?.infoTecnica ??
    `${titulo} — confira preço e disponibilidade na Atlas Nova Clean.`;

  // Mesma chamada (URL + params idênticos) de dentro do componente da página é
  // deduplicada pelo fetch memoization do Next — não dobra a requisição.
  let imagemUrl: string | undefined;
  try {
    const imagens = await listarImagensProduto(principal.id);
    imagemUrl = imagens.find((img) => img.principal)?.url ?? imagens[0]?.url;
  } catch {
    // Sem imagem cadastrada (ou API de imagens fora do ar) — OG image cai pro
    // padrão do site (definido no layout), não é um erro de metadata.
  }

  return {
    title: titulo,
    description: descricao,
    openGraph: {
      title: titulo,
      description: descricao,
      images: imagemUrl ? [{ url: imagemUrl }] : undefined,
    },
  };
}

async function montarProductJsonLd(produto: Produto, slug: string) {
  let imagemUrl: string | undefined;
  try {
    const imagens = await listarImagensProduto(produto.id);
    imagemUrl = imagens.find((img) => img.principal)?.url ?? imagens[0]?.url;
  } catch {
    // Sem imagem cadastrada — Product aceita sem `image`, não é obrigatório.
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produto.produtoTipo?.nome ?? produto.nome,
    description: produto.descricao ?? produto.produtoTipo?.infoTecnica,
    image: imagemUrl,
    sku: produto.id,
    ...(produto.marca ? { brand: { '@type': 'Brand', name: produto.marca.nome } } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/produtos/${slug}`,
      priceCurrency: 'BRL',
      price: produto.precoPromocional ?? produto.preco,
      availability:
        produto.estoque > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export default async function Page({ params }: PageProps<'/produtos/[slug]'>) {
  const { slug } = await params;
  const variantes = await buscarVariantes(slug);

  if (variantes.length === 0) {
    notFound();
  }

  const jsonLd = await montarProductJsonLd(variantes[0], slug);

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProdutoDetalhe variantes={variantes} />
      <div className="mx-auto max-w-[1180px] px-5 pb-10">
        <ProdutosRelacionados
          categoria={variantes[0].categoria}
          produtoTipoSlugAtual={variantes[0].produtoTipo?.slug}
        />
      </div>
    </>
  );
}
