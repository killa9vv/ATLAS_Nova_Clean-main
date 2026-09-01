import { notFound } from 'next/navigation';
import { listarProdutos } from '@/lib/produtos';
import { ProdutoDetalhe } from '@/components/loja/ProdutoDetalhe';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: PageProps<'/produtos/[slug]'>) {
  const { slug } = await params;
  const { itens } = await listarProdutos({ pagina: 1, limite: 200 });
  const variantes = itens.filter((produto) => produto.produtoTipo?.slug === slug);

  if (variantes.length === 0) {
    notFound();
  }

  return <ProdutoDetalhe variantes={variantes} />;
}
