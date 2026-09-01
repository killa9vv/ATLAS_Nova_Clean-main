import { listarResenhas } from '@/lib/resenhas';
import { ReviewsBody } from './ReviewsBody';

export async function ReviewsSection() {
  const resenhas = await listarResenhas();

  return (
    <section id="avaliacoes" className="mx-auto max-w-[1180px] scroll-mt-20 px-5 py-10">
      <div className="mb-7 max-w-[60ch]">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
          Avaliações de clientes
        </p>
        <h2 className="font-display text-2xl font-bold text-navy">
          O que dizem sobre a Atlas Nova Clean
        </h2>
      </div>
      <ReviewsBody resenhasIniciais={resenhas} />
    </section>
  );
}
