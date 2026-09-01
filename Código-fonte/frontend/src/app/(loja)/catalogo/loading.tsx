import { ProductCardSkeleton } from '@/components/ui/Skeleton';

export default function CatalogoLoading() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10">
      <div
        className="grid gap-[18px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
