import Image from 'next/image';
import { BRANDS, PRODUCTS } from '@/data/products';

const SWATCHES = [
  { name: 'navy', className: 'bg-navy' },
  { name: 'navy-2', className: 'bg-navy-2' },
  { name: 'blue', className: 'bg-blue' },
  { name: 'sky', className: 'bg-sky' },
  { name: 'paper', className: 'bg-paper' },
  { name: 'ink', className: 'bg-ink' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'amber', className: 'bg-amber' },
  { name: 'green', className: 'bg-green' },
  { name: 'line', className: 'bg-line' },
] as const;

// Página de auto-teste do design system (fontes, cores, radius, sombra, animação,
// assets e dados do catálogo) — não é um rascunho da Home. Quem pegar o cartão
// "Home / vitrine" substitui este arquivo inteiro.
export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Atlas Nova Clean</h1>
        <p className="mt-2 font-sans text-muted">
          Página de verificação do design system portado do site estático — tipografia, cores,
          raios, sombras, animações e dados do catálogo.
        </p>
        <code className="mt-2 inline-block font-mono text-sm text-ink">
          {PRODUCTS.length} produtos · {BRANDS.length} marcas
        </code>
      </div>

      <div className="flex flex-wrap gap-3">
        {SWATCHES.map((s) => (
          <div
            key={s.name}
            className={`flex h-16 w-16 items-center justify-center rounded-atlas shadow-atlas text-[10px] font-mono text-white ${s.className}`}
          >
            {s.name}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-atlas-sm bg-white shadow-atlas-lg" />
        <span className="font-mono text-sm text-muted">rounded-atlas-sm + shadow-atlas-lg</span>
      </div>

      <div className="motion-reduce:animate-none h-10 w-10 animate-blob-float rounded-full bg-blue" />

      <div className="flex items-center gap-6">
        <Image src="/logo.png" alt="Atlas Nova Clean" width={48} height={48} />
        <Image src="/brands/ype.png" alt="Ypê" width={48} height={48} />
      </div>
    </main>
  );
}
