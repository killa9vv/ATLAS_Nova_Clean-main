import type { ReactNode } from 'react';

export interface LegalArticleProps {
  titulo: string;
  atualizadoEm: string;
  aviso: string;
  children: ReactNode;
}

// Casca comum das 4 páginas jurídicas — título, data, prosa (h2/p/ul/ol via
// children, estilizados globalmente aqui) e a caixa de aviso final ("texto-modelo,
// revisar antes de tratar como definitivo"), igual ao site antigo.
export function LegalArticle({ titulo, atualizadoEm, aviso, children }: LegalArticleProps) {
  return (
    <main className="mx-auto max-w-[720px] px-5 py-12">
      <h1 className="font-display text-3xl font-bold text-navy">{titulo}</h1>
      <p className="mt-1.5 text-[13px] text-muted">Última atualização: {atualizadoEm}</p>

      <div className="mt-6 flex flex-col gap-4 text-[14px] leading-relaxed text-ink [&_a]:font-semibold [&_a]:text-blue [&_a]:hover:underline [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-navy [&_li]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>

      <div className="mt-8 rounded-atlas-sm border border-line bg-sky px-4 py-3 text-[12.5px] leading-relaxed text-navy">
        {aviso}
      </div>
    </main>
  );
}
