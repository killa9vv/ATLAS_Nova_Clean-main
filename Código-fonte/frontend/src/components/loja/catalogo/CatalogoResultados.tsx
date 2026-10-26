'use client';

import { ProductCard } from '@/components/loja/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Produto } from '@/lib/produtos';

export interface CatalogoResultadosProps {
  produtos: Produto[] | undefined;
  isLoading: boolean;
  isError: boolean;
  temFiltroAtivo: boolean;
  aoLimparFiltros: () => void;
  aoTentarNovamente: () => void;
}

// Isolado do resto da página de propósito: erro/loading aqui nunca derruba filtros,
// busca ou paginação — só essa área troca de conteúdo.
export function CatalogoResultados({
  produtos,
  isLoading,
  isError,
  temFiltroAtivo,
  aoLimparFiltros,
  aoTentarNovamente,
}: CatalogoResultadosProps) {
  if (isLoading) {
    return <ProductGridSkeleton quantidade={12} />;
  }

  if (isError) {
    return (
      <EmptyState
        icone="⚠️"
        titulo="Não conseguimos carregar o catálogo"
        texto="Os filtros continuam aplicados — tente de novo em instantes."
        acao={
          <Button variant="secondary" onClick={aoTentarNovamente}>
            Tentar de novo
          </Button>
        }
      />
    );
  }

  if (!produtos || produtos.length === 0) {
    return (
      <EmptyState
        titulo="Nenhum produto encontrado"
        texto={
          temFiltroAtivo
            ? 'Ninguém bate com os filtros aplicados agora.'
            : 'O catálogo está vazio no momento.'
        }
        acao={
          temFiltroAtivo && (
            <Button variant="secondary" onClick={aoLimparFiltros}>
              Limpar filtros
            </Button>
          )
        }
      />
    );
  }

  return (
    <div
      className="grid gap-3.5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}
    >
      {produtos.map((produto, indice) => (
        <ProductCard key={produto.id} produto={produto} indice={indice} />
      ))}
    </div>
  );
}
