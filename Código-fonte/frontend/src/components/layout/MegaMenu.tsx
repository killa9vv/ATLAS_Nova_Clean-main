'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BRANDS, CATEGORIES, PRODUCT_TYPES, type Category } from '@/data/products';
import { corDaCategoria, iconeDaCategoria } from '@/lib/categoria-visual';

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

// Os arquivos em public/brands seguem o nome da marca sem acento, ex.: "Ypê" -> ype.png.
function logoDaMarca(marca: string): string {
  const nome = marca
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
  return `/brands/${nome}.png`;
}

export function MegaMenu() {
  const [open, setOpen] = useState(false);
  // true logo depois de Esc fechar o menu — suprime nav:group-hover/focus-within
  // (que senão reabririam o painel na hora, já que o foco costuma voltar pro
  // próprio botão gatilho, que está dentro do `group`). Limpo no próximo
  // mouseenter/clique/foco genuíno no gatilho, não no refoco que o próprio Esc causa.
  const [suprimido, setSuprimido] = useState(false);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  // Janela depois de Esc em que o foco-de-volta pro gatilho (causado por nós mesmos,
  // dentro do handler de Esc) não deve por si só limpar `suprimido` — um refoco
  // genuíno do usuário (ex.: Shift+Tab de volta bem depois) sempre acontece fora
  // dessa janela e limpa normalmente.
  const suprimidoAteRef = useRef(0);
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
  // de navegar). `suprimido` é pro :hover/:focus-within: com o mouse parado em cima do link
  // clicado, o painel continuaria cobrindo a página nova. Volta ao entrar de novo com o mouse.
  function closeOnNavigate() {
    setOpen(false);
    setSuprimido(true);
  }

  function aoTeclaNoGrupo(evento: React.KeyboardEvent) {
    if (evento.key !== 'Escape') return;
    setOpen(false);
    setSuprimido(true);
    suprimidoAteRef.current = Date.now() + 300;
    gatilhoRef.current?.focus();
  }

  function aoFocarGatilho() {
    if (Date.now() > suprimidoAteRef.current) setSuprimido(false);
  }

  return (
    <div
      className="group relative flex flex-col items-stretch border-b border-line nav:flex-row nav:items-center nav:border-b-0"
      onMouseLeave={() => setOpen(false)}
      onMouseEnter={() => setSuprimido(false)}
      onKeyDown={aoTeclaNoGrupo}
    >
      <button
        ref={gatilhoRef}
        type="button"
        className="flex w-full items-center justify-between gap-1.5 whitespace-nowrap rounded-none px-5 py-3.5 text-[13px] font-semibold text-navy transition-colors hover:bg-sky hover:text-blue motion-reduce:transition-none nav:w-auto nav:justify-start nav:rounded-[20px] nav:px-3 nav:py-2 nav:group-hover:bg-sky nav:group-hover:text-blue"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="nav-mega-panel"
        onFocus={aoFocarGatilho}
        onClick={() => {
          setSuprimido(false);
          setOpen((v) => !v);
        }}
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
          suprimido ? '' : 'nav:group-hover:grid nav:group-focus-within:grid',
          'painel-cai w-full grid-cols-1 gap-0 bg-sky',
          // O ::before cobre o vão de 8px até o botão: sem ele, descer o mouse devagar saía do
          // :hover do grupo e o painel fechava antes de chegar.
          'nav:absolute nav:left-0 nav:top-full nav:z-[200] nav:mt-2 nav:w-max nav:max-w-[960px] nav:grid-cols-[repeat(3,minmax(190px,1fr))_minmax(190px,210px)] nav:gap-6 nav:rounded-atlas nav:border nav:border-line nav:bg-white nav:p-[22px] nav:shadow-atlas-lg nav:before:absolute nav:before:inset-x-0 nav:before:-top-2.5 nav:before:h-2.5',
        ].join(' ')}
      >
        {CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="flex min-w-0 flex-col border-b border-line px-5 py-3 nav:border-b-0 nav:px-0 nav:py-0"
          >
            <div className="flex items-center justify-between gap-2 nav:mb-2 nav:border-b nav:border-line nav:pb-2.5">
              <Link
                href={`/#${cat}`}
                onClick={closeOnNavigate}
                className="group/categoria flex items-center gap-2.5 font-display text-sm font-bold text-navy hover:text-blue"
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/categoria:-rotate-6 group-hover/categoria:scale-110 motion-reduce:transition-none"
                  style={{ background: corDaCategoria(cat) }}
                >
                  {iconeDaCategoria(cat)}
                </span>
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
              className={`${openColumns[cat] ? 'flex' : 'hidden'} flex-col gap-px pt-2.5 [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin] nav:flex nav:max-h-[320px] nav:overflow-y-auto nav:pb-5 nav:pt-0 nav:[mask-image:linear-gradient(to_bottom,black_calc(100%-28px),transparent)]`}
            >
              {PRODUCT_TYPES.filter((t) => t.cat === cat).map((type) => (
                <Link
                  key={type.id}
                  href={`/produtos/${type.id}`}
                  onClick={closeOnNavigate}
                  className="group/item flex items-center justify-between gap-2 rounded-md px-2 py-2.5 text-left text-[12.5px] font-semibold leading-[1.3] text-wrap text-muted transition-colors hover:bg-sky hover:text-navy motion-reduce:transition-none nav:px-2 nav:py-[7px]"
                >
                  {type.name}
                  <span
                    aria-hidden="true"
                    className="shrink-0 -translate-x-1 text-blue opacity-0 transition-[translate,opacity] duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100 motion-reduce:transition-none"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col px-5 pb-5 pt-3.5 nav:-my-2 nav:-mr-2 nav:rounded-atlas-sm nav:bg-paper nav:p-3.5">
          <div className="mb-2.5 flex h-8 items-center nav:mb-2.5">
            <Link
              href="/#marcas"
              onClick={closeOnNavigate}
              className="font-display text-sm font-bold text-navy hover:text-blue"
            >
              Marcas
            </Link>
          </div>
          <div className="mb-3.5 grid grid-cols-2 gap-1.5">
            {topBrands.map(({ brand }) => (
              <Link
                key={brand}
                href={`/marcas/${encodeURIComponent(brand)}`}
                onClick={closeOnNavigate}
                aria-label={brand}
                className="relative flex h-11 items-center justify-center rounded-atlas-sm border border-line bg-white transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-blue hover:shadow-atlas motion-reduce:transition-none"
              >
                <Image
                  src={logoDaMarca(brand)}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain p-1.5"
                />
              </Link>
            ))}
          </div>
          <Link
            href="/#marcas"
            onClick={closeOnNavigate}
            className="mb-2.5 text-xs font-bold text-blue hover:underline"
          >
            Ver todas as marcas →
          </Link>
          <Link
            href="/catalogo"
            onClick={closeOnNavigate}
            className="mt-auto rounded-atlas-sm bg-navy px-3 py-2.5 text-center text-[12.5px] font-bold text-white transition-colors hover:bg-navy-2 motion-reduce:transition-none"
          >
            Ver catálogo completo →
          </Link>
        </div>
      </div>
    </div>
  );
}
