'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BRANDS, PRODUCTS } from '@/data/products';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

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

function DesignSystemComponentsPreview() {
  const [modalAberto, setModalAberto] = useState(false);
  const { showToast } = useToast();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Badge</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="navy">Novo</Badge>
          <Badge variant="amber">Promoção</Badge>
          <Badge variant="green">Em estoque</Badge>
          <Badge variant="sky">Papelaria</Badge>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Input</h2>
        <div className="max-w-xs">
          <Input label="Nome" placeholder="Seu nome" />
        </div>
        <div className="mt-3 max-w-xs">
          <Input label="E-mail" placeholder="voce@email.com" error="Campo obrigatório." />
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Card</h2>
        <Card className="max-w-xs">
          <p className="text-sm text-ink">Conteúdo dentro de um Card.</p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Skeleton</h2>
        <div className="max-w-55">
          <ProductCardSkeleton />
        </div>
        <Skeleton className="mt-3 h-4 w-40" />
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Modal e Toast</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModalAberto(true)}>Abrir modal</Button>
          <Button variant="secondary" onClick={() => showToast('Ação concluída com sucesso.', 'success')}>
            Toast de sucesso
          </Button>
          <Button variant="secondary" onClick={() => showToast('Algo deu errado.', 'error')}>
            Toast de erro
          </Button>
        </div>
        <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Exemplo de modal">
          <p className="text-sm text-muted">Fecha com Esc, clique fora, ou no X.</p>
        </Modal>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Breadcrumbs</h2>
        <div className="rounded-atlas border border-line">
          <Breadcrumbs items={[{ label: 'Limpeza', href: '/#limpeza' }, { label: 'Detergente' }]} />
        </div>
      </div>
    </div>
  );
}

// Página de auto-teste do design system (fontes, cores, radius, sombra, animação,
// assets, dados do catálogo e componentes base) — não é um rascunho da Home. Quem
// pegar o cartão "Home / vitrine" substitui este arquivo inteiro.
export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Atlas Nova Clean</h1>
        <p className="mt-2 font-sans text-muted">
          Página de verificação do design system portado do site estático — tipografia, cores,
          raios, sombras, animações, dados do catálogo e componentes base.
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

      <DesignSystemComponentsPreview />
    </main>
  );
}
