'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cart-context';
import { listarImagensProduto, listarProdutos, type Produto } from '@/lib/produtos';

// Grade simples e deliberadamente sem polimento — existe só pra dar suporte real ao
// carrinho (produtos de verdade, com produtoId real do banco). O card "Home/vitrine"
// substitui a Home (ver src/app/(loja)/page.tsx) e eventualmente essa página também,
// mas isso é escopo futuro separado.
const LIMITE_POR_PAGINA = 12;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CardProduto({ produto }: { produto: Produto }) {
  const { adicionar } = useCart();
  const { showToast } = useToast();

  const imagensQuery = useQuery({
    queryKey: ['produto-imagens', produto.id],
    queryFn: () => listarImagensProduto(produto.id),
  });

  const imagens = imagensQuery.data ?? [];
  const imagemPrincipal = imagens.find((img) => img.principal) ?? imagens[0];

  function aoAdicionar() {
    adicionar(produto.id, produto.nome, produto.preco);
    showToast('Adicionado ao carrinho.', 'success');
  }

  return (
    <div className="flex flex-col gap-3 rounded-atlas border border-line bg-white p-4 shadow-atlas">
      <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-atlas-sm bg-sky">
        {imagemPrincipal ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagemPrincipal.thumbnailUrl}
            alt={produto.nome}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[11px] font-semibold text-muted">Sem imagem</span>
        )}
      </div>
      {produto.categoria && (
        <span className="text-[11px] uppercase tracking-wide text-muted">{produto.categoria}</span>
      )}
      <h3 className="font-display text-[14px] font-bold text-navy">{produto.nome}</h3>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[15px] font-bold text-navy">{formatarMoeda(produto.preco)}</span>
        <Button size="sm" onClick={aoAdicionar} disabled={produto.estoque <= 0}>
          {produto.estoque <= 0 ? 'Esgotado' : 'Adicionar'}
        </Button>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={null}>
      <CatalogoConteudo />
    </Suspense>
  );
}

function CatalogoConteudo() {
  const searchParams = useSearchParams();
  const [pagina, setPagina] = useState(1);
  const busca = searchParams.get('q') ?? undefined;

  const produtosQuery = useQuery({
    queryKey: ['catalogo', 'produtos', pagina, busca],
    queryFn: () => listarProdutos({ pagina, limite: LIMITE_POR_PAGINA, busca }),
  });

  const produtos = produtosQuery.data?.itens ?? [];
  const totalPaginas = produtosQuery.data?.totalPaginas ?? 1;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">
        {busca ? `Resultados para "${busca}"` : 'Catálogo'}
      </h1>

      {produtosQuery.isLoading && (
        <div className="grid grid-cols-2 gap-4 nav:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: LIMITE_POR_PAGINA }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!produtosQuery.isLoading && produtos.length === 0 && (
        <p className="py-10 text-center text-muted">Nenhum produto encontrado.</p>
      )}

      {produtos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 nav:grid-cols-3 lg:grid-cols-4">
          {produtos.map((produto) => (
            <CardProduto key={produto.id} produto={produto} />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-[13px]">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-muted">
            Página {pagina} de {totalPaginas}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </main>
  );
}
