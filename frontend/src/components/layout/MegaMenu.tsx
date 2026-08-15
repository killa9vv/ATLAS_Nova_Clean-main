'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BRANDS, CATEGORIES, PRODUCT_TYPES, type Category } from '@/data/products';

const TOP_BRANDS_COUNT = 8;

const CATEGORY_LABELS: Record<Category, string> = {
  limpeza: 'Limpeza',
  descartaveis: 'Descartáveis',
  papelaria: 'Papelaria',
};

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const topBrands = BRANDS.slice(0, TOP_BRANDS_COUNT);

export function MegaMenu() {
  const [open, setOpen] = useState(false);
  // No desktop as colunas ficam sempre visíveis (ver comentário do nav.js
  // original); esse estado só importa no mobile, onde cada coluna abre
  // independente via seu próprio caret.
  const [openColumns, setOpenColumns] = useState<Record<Category, boolean>>({
    limpeza: false,
    descartaveis: false,
    papelaria: false,
  });

  function toggleColumn(cat: Category) {
    setOpenColumns((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  // Navegar por qualquer link do painel fecha o mega-menu (o Header fica
  // montado entre páginas, então sem isso ele continuaria aberto depois
  // de navegar).
  function closeOnNavigate() {
    setOpen(false);
  }

  return (
    <div
      className="group relative flex flex-col items-stretch border-b border-line nav:flex-row nav:items-center nav:border-b-0"
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-1.5 whitespace-nowrap rounded-none px-5 py-3.5 text-[13px] font-semibold text-navy hover:bg-sky nav:w-auto nav:justify-start nav:rounded-[20px] nav:px-3 nav:py-2"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="nav-mega-panel"
        onClick={() => setOpen((v) => !v)}
      >
        Produtos
        <ChevronIcon
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} nav:group-hover:rotate-180`}
        />
      </button>

      <div
        id="nav-mega-panel"
        role="group"
        aria-label="Categorias de produtos"
        className={[
          open ? 'grid' : 'hidden',
          'nav:group-hover:grid nav:group-focus-within:grid',
          'w-full grid-cols-1 gap-0 bg-sky',
          'nav:absolute nav:left-0 nav:top-full nav:z-[200] nav:mt-2 nav:w-max nav:max-w-[920px] nav:grid-cols-[repeat(3,minmax(190px,1fr))_minmax(170px,200px)] nav:gap-[26px] nav:rounded-atlas nav:border nav:border-line nav:bg-white nav:p-[22px] nav:shadow-atlas-lg',
        ].join(' ')}
      >
        {CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="flex min-w-0 flex-col border-b border-line px-5 py-3 nav:border-b-0 nav:px-0 nav:py-0"
          >
            <div className="flex items-center justify-between gap-2 nav:mb-2.5 nav:border-b-2 nav:border-line nav:pb-2.5">
              <Link
                href={`/#${cat}`}
                onClick={closeOnNavigate}
                className="font-display text-sm font-bold text-navy hover:text-blue"
              >
                {CATEGORY_LABELS[cat]}
              </Link>
              <button
                type="button"
                className="flex items-center justify-center p-1 text-muted nav:hidden"
                aria-label={`Ver tipos de produto em ${CATEGORY_LABELS[cat]}`}
                aria-expanded={openColumns[cat]}
                onClick={() => toggleColumn(cat)}
              >
                <ChevronIcon
                  className={`transition-transform duration-200 ${openColumns[cat] ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <div
              className={`${openColumns[cat] ? 'flex' : 'hidden'} flex-col gap-px pt-2.5 nav:flex nav:max-h-[320px] nav:overflow-y-auto nav:pt-0`}
            >
              {PRODUCT_TYPES.filter((t) => t.cat === cat).map((type) => (
                <Link
                  key={type.id}
                  href={`/produtos/${type.id}`}
                  onClick={closeOnNavigate}
                  className="block rounded-md px-2 py-2.5 text-left text-[12.5px] font-semibold leading-[1.3] text-wrap text-muted hover:bg-sky hover:text-navy nav:px-2 nav:py-[7px]"
                >
                  {type.name}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col px-5 pb-5 pt-3.5 nav:px-0 nav:pb-0 nav:pt-0">
          <div className="mb-2.5 nav:mb-2.5">
            <Link
              href="/#marcas"
              onClick={closeOnNavigate}
              className="font-display text-sm font-bold text-navy hover:text-blue"
            >
              Marcas
            </Link>
          </div>
          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {topBrands.map(({ brand }) => (
              <Link
                key={brand}
                href={`/marcas/${encodeURIComponent(brand)}`}
                onClick={closeOnNavigate}
                className="rounded-[14px] bg-sky px-2.5 py-1.5 text-[11.5px] font-bold text-navy hover:bg-navy hover:text-white"
              >
                {brand}
              </Link>
            ))}
          </div>
          <Link
            href="/#marcas"
            onClick={closeOnNavigate}
            className="mt-auto text-xs font-bold text-blue hover:underline"
          >
            Ver todas as marcas →
          </Link>
        </div>
      </div>
    </div>
  );
}
