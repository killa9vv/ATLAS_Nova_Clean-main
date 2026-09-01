import { listarMarcas } from '@/lib/marcas';
import { Hero } from '@/components/loja/Hero';
import { MarcasSection } from '@/components/loja/MarcasSection';
import { CategorySection } from '@/components/loja/CategorySection';
import { ValueProps } from '@/components/loja/ValueProps';
import { ReviewsSection } from '@/components/loja/ReviewsSection';
import { CtaBand } from '@/components/loja/CtaBand';

// Estoque/preço/ativo mudam via admin a qualquer momento — sem isso, o build
// estático congelaria a home com os dados de quando rodou `next build`.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const marcas = await listarMarcas();

  return (
    <main>
      <Hero />
      <MarcasSection marcas={marcas} />
      <CategorySection categoria="limpeza" numero="01" indice={1} total={3} />
      <CategorySection categoria="descartaveis" numero="02" indice={2} total={3} />
      <CategorySection categoria="papelaria" numero="03" indice={3} total={3} />
      <ValueProps />
      <ReviewsSection />
      <CtaBand />
    </main>
  );
}
