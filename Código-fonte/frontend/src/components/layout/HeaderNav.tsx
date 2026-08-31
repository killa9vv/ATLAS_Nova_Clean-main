'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MegaMenu } from './MegaMenu';
import { CartButton } from './CartButton';
import { useCart } from '@/lib/cart-context';

const NAV_LINK_CLASS =
  'block px-5 py-3.5 text-[13px] font-semibold text-navy hover:bg-sky nav:inline-block nav:rounded-[20px] nav:px-3 nav:py-2';

export function HeaderNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { quantidadeTotal } = useCart();

  // Delegação igual à do main.js original: clicar em qualquer link de
  // navegação de verdade fecha o menu mobile; o próprio gatilho do
  // mega-menu e os carets de coluna são <button>, então não entram aqui.
  function handleNavClick(e: MouseEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest('a')) {
      setMobileOpen(false);
    }
  }

  return (
    <>
      <nav
        aria-label="Navegação principal"
        onClick={handleNavClick}
        className={[
          'absolute left-0 right-0 top-full flex flex-col items-stretch gap-0 overflow-hidden border-b border-line bg-white shadow-atlas-lg transition-[max-height] duration-300 ease-in-out',
          mobileOpen ? 'max-h-[70vh] overflow-y-auto' : 'max-h-0',
          'nav:static nav:max-h-none nav:flex-1 nav:flex-row nav:items-center nav:gap-1 nav:overflow-visible nav:border-b-0 nav:bg-transparent nav:shadow-none',
        ].join(' ')}
      >
        <MegaMenu />
        <Link href="/#avaliacoes" className={NAV_LINK_CLASS}>
          Avaliações
        </Link>
        <Link href="/#sobre" className={NAV_LINK_CLASS}>
          Sobre a loja
        </Link>
      </nav>

      <div className="flex shrink-0 items-center gap-2.5">
        <form action="/catalogo" className="relative hidden nav:block">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="pointer-events-none absolute left-[11px] top-[9px] h-3.5 w-3.5 stroke-muted"
          >
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="M21 21l-4-4" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Buscar produto..."
            className="w-[180px] rounded-[20px] border border-line bg-white py-2 pl-[34px] pr-3 font-sans text-[13px]"
          />
        </form>

        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          aria-controls="header-nav"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] nav:hidden"
        >
          <span
            className={`block h-0.5 w-5 rounded-sm bg-navy transition-transform duration-200 ${mobileOpen ? 'translate-y-[7px] rotate-45' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 rounded-sm bg-navy transition-opacity duration-200 ${mobileOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-0.5 w-5 rounded-sm bg-navy transition-transform duration-200 ${mobileOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
          />
        </button>

        <CartButton count={quantidadeTotal} onClick={() => router.push('/carrinho')} />
      </div>
    </>
  );
}
