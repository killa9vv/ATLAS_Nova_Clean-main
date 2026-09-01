import { notFound } from 'next/navigation';
import { listarProdutos } from '@/lib/produtos';
import { CategoryGrid } from '@/components/loja/CategoryGrid';
import { BackButton } from '@/components/loja/BackButton';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: PageProps<'/marcas/[brand]'>) {
  const { brand } = await params;
  const nomeMarca = decodeURIComponent(brand);
  const { itens } = await listarProdutos({ pagina: 1, limite: 200 });
  const produtosDaMarca = itens.filter((produto) => produto.marca?.nome === nomeMarca);

  if (produtosDaMarca.length === 0) {
    notFound();
  }

  const logo = produtosDaMarca[0].marca?.imagemUrl;

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10">
      <BackButton />
      <div className="mb-6 flex items-center gap-4">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={nomeMarca}
            className="h-16 w-16 rounded-full border border-line bg-white object-contain p-2 shadow-atlas"
          />
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">{nomeMarca}</h1>
          <p className="text-[13px] text-muted">{produtosDaMarca.length} produtos</p>
        </div>
      </div>

      <CategoryGrid produtos={produtosDaMarca} />
    </main>
  );
}
