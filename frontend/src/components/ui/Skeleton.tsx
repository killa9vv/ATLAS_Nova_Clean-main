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
