import { HTMLAttributes } from 'react';

export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse rounded-atlas-sm bg-line', className].join(' ')}
      {...props}
    />
  );
}

/** Placeholder de um product-card enquanto o catálogo carrega — mesma estrutura visual do card real. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-atlas border border-line bg-white p-4 shadow-atlas">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="mt-1 flex items-center justify-between">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/** Placeholder de uma fileira horizontal de cards — usado nos carrosséis (novidades, marcas) da home. */
export function ProductRowSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="flex gap-[18px] overflow-hidden">
      {Array.from({ length: quantidade }).map((_, i) => (
        <div key={i} className="w-[220px] shrink-0">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/** Placeholder de uma grade de produtos — usado nas seções por categoria da home. */
export function ProductGridSkeleton({ quantidade = 8 }: { quantidade?: number }) {
  return (
    <div
      className="grid gap-3.5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}
    >
      {Array.from({ length: quantidade }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Placeholder dos atalhos de categoria da home. */
export function CategoriaAtalhosSkeleton() {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-[68px] w-full" />
      ))}
    </div>
  );
}

/** Placeholder da seção de avaliações da home. */
export function ReviewsSkeleton() {
  return (
    <div className="grid gap-7 nav:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-3.5">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}
