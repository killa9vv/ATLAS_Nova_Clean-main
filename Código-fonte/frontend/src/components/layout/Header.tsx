import Image from 'next/image';
import Link from 'next/link';
import { HeaderNav } from './HeaderNav';

export interface HeaderProps {
  /**
   * "full" (mega-menu, busca, botão de carrinho) é implementado pelo
   * cartão "Layout base e navegação". "simple" é o header enxuto usado
   * nas páginas legais (sem nav/busca/carrinho).
   */
  variant: 'full' | 'simple';
}

function BrandLink() {
  return (
    <Link href="/" aria-label="Voltar para o início" className="flex shrink-0 items-center gap-2.5">
      <Image src="/logo.png" alt="Atlas Nova Clean" width={36} height={36} className="shrink-0" />
      <span className="font-display leading-none">
        <b className="block text-lg font-bold text-navy">ATLAS</b>
        <span className="block text-[10px] font-semibold tracking-[0.18em] text-blue">
          NOVA CLEAN
        </span>
      </span>
    </Link>
  );
}

export function Header({ variant }: HeaderProps) {
  if (variant === 'simple') {
    return (
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4.5 px-5 py-3.5">
          <BrandLink />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-[10px]">
      <div className="relative mx-auto flex max-w-[1180px] items-center justify-between gap-4.5 px-5 py-3.5">
        <BrandLink />
        <HeaderNav />
      </div>
    </header>
  );
}
