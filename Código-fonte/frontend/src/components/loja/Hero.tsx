import Link from 'next/link';

const CAT_TILES = [
  { cat: 'limpeza', icone: '🧽', nome: 'Limpeza', cor: '#2e9bf5' },
  { cat: 'descartaveis', icone: '🥤', nome: 'Descartáveis', cor: '#ffb020' },
  { cat: 'papelaria', icone: '📎', nome: 'Papelaria', cor: '#1faa59' },
];

const STAT_PILLS = [
  { icone: '🚚', texto: 'Entrega rápida em Campos' },
  { icone: '💳', texto: 'Pix, cartão ou combinado no WhatsApp' },
  { icone: '📦', texto: 'Atacado e varejo' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden py-14">
      {/* Palco dos blobs sem overflow-hidden próprio (só a section tem) — assim eles
          podem "vazar" bem além da largura do conteúdo (1180px) e o desfoque tem
          espaço de sobra pra sumir antes de qualquer borda visível, em vez de ser
          cortado de repente numa linha reta. */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-[1180px] -translate-x-1/2">
        <span
          aria-hidden="true"
          className="animate-blob-float motion-reduce:animate-none absolute -top-[150px] -right-[40px] h-[380px] w-[380px] rounded-full opacity-35 blur-[70px]"
          style={{ background: '#2e9bf5' }}
        />
        <span
          aria-hidden="true"
          className="animate-blob-float motion-reduce:animate-none absolute -bottom-[130px] -left-[60px] h-[300px] w-[300px] rounded-full opacity-35 blur-[70px]"
          style={{ background: '#1faa59', animationDelay: '-5s' }}
        />
        <span
          aria-hidden="true"
          className="animate-blob-float motion-reduce:animate-none absolute right-[15%] top-[35%] h-[240px] w-[240px] rounded-full opacity-35 blur-[65px]"
          style={{ background: '#ffb020', animationDelay: '-10s' }}
        />
      </div>

      <div className="relative mx-auto grid max-w-[1180px] gap-10 px-5 nav:grid-cols-[1.3fr_1fr] nav:items-center">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
            Campos dos Goytacazes, RJ
          </p>
          <h1 className="font-display text-[clamp(32px,4.2vw,54px)] font-bold leading-[1.05] tracking-tight text-navy">
            Limpeza, descartáveis e papelaria{' '}
            <span className="bg-gradient-to-r from-blue to-green bg-clip-text text-transparent">
              sem sair de casa
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[15px] text-muted">
            Atacado e varejo das marcas que você já confia. Monte sua lista e feche pelo WhatsApp ou
            pague direto no site.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {STAT_PILLS.map((pill) => (
              <span
                key={pill.texto}
                className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[12.5px] font-semibold text-navy shadow-atlas"
              >
                <span aria-hidden="true">{pill.icone}</span>
                {pill.texto}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 nav:order-none order-[-1]">
          {CAT_TILES.map((tile) => (
            <Link
              key={tile.cat}
              href={`#${tile.cat}`}
              className="group flex items-center gap-3.5 rounded-atlas border border-line bg-white p-4 shadow-atlas transition-transform hover:translate-x-1"
              style={{ borderLeft: `5px solid ${tile.cor}` }}
            >
              <span className="text-2xl" aria-hidden="true">
                {tile.icone}
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-bold text-navy">{tile.nome}</span>
                <span className="text-[12px] font-semibold text-blue">Ver produtos →</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
