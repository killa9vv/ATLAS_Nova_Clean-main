import { Suspense } from 'react';
import { Hero } from '@/components/loja/Hero';
import { CategoriaAtalhos } from '@/components/loja/CategoriaAtalhos';
import { PromocoesSection } from '@/components/loja/PromocoesSection';
import { MaisVendidosSection } from '@/components/loja/MaisVendidosSection';
import { NovidadesSection } from '@/components/loja/NovidadesSection';
import { MarcasSection } from '@/components/loja/MarcasSection';
import { CategorySection } from '@/components/loja/CategorySection';
import { ValueProps } from '@/components/loja/ValueProps';
import { ReviewsSection } from '@/components/loja/ReviewsSection';
import { TrustBadges } from '@/components/loja/TrustBadges';
import { CtaBand } from '@/components/loja/CtaBand';
import {
  CategoriaAtalhosSkeleton,
  ProductGridSkeleton,
  ProductRowSkeleton,
  ReviewsSkeleton,
} from '@/components/ui/Skeleton';

// Cada seção define seu próprio `next.revalidate` por fetch (ver cada componente) —
// banners são config local (sem fetch), categorias/marcas mudam pouco (revalidate
// longo), produtos/avaliações mudam mais (revalidate curto). Sem `force-dynamic` aqui,
// o ISR de cada fetch é quem passa a controlar o quão "fresca" cada seção fica.
export default function Page() {
  return (
    <main>
      <Hero />

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ProductRowSkeleton />
          </div>
        }
      >
        <MarcasSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ProductGridSkeleton />
          </div>
        }
      >
        <PromocoesSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-8">
            <CategoriaAtalhosSkeleton />
          </div>
        }
      >
        <CategoriaAtalhos />
      </Suspense>

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ProductRowSkeleton />
          </div>
        }
      >
        <MaisVendidosSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ProductRowSkeleton />
          </div>
        }
      >
        <NovidadesSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ProductGridSkeleton />
          </div>
        }
      >
        <CategorySection categoria="limpeza" numero="01" indice={1} total={3} />
      </Suspense>
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ProductGridSkeleton />
          </div>
        }
      >
        <CategorySection categoria="descartaveis" numero="02" indice={2} total={3} />
      </Suspense>
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ProductGridSkeleton />
          </div>
        }
      >
        <CategorySection categoria="papelaria" numero="03" indice={3} total={3} />
      </Suspense>

      <Suspense fallback={null}>
        <ValueProps />
      </Suspense>

      <Suspense
        fallback={
          <div className="mx-auto max-w-[1180px] px-5 py-10">
            <ReviewsSkeleton />
          </div>
        }
      >
        <ReviewsSection />
      </Suspense>

      <div className="py-6">
        <Suspense fallback={null}>
          <TrustBadges />
        </Suspense>
      </div>

      <CtaBand />
    </main>
  );
}
