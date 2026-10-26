'use client';

import type { Ordenacao } from '@/lib/catalogo-filtros';

export interface CatalogoOrdenacaoProps {
  valor: Ordenacao;
  aoMudar: (valor: Ordenacao) => void;
}

// "Relevância" é a ordem padrão da API (createdAt desc) — não existe ranking de
// busca full-text no backend. Ver lib/catalogo-filtros.ts (paraParametrosApi) pro
// porquê de não haver uma opção separada de "mais recentes" (seria idêntica).
const OPCOES: { valor: Ordenacao; rotulo: string }[] = [
  { valor: 'relevancia', rotulo: 'Relevância' },
  { valor: 'menor-preco', rotulo: 'Menor preço' },
  { valor: 'maior-preco', rotulo: 'Maior preço' },
];

export function CatalogoOrdenacao({ valor, aoMudar }: CatalogoOrdenacaoProps) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-navy">
      {/* sr-only (não `hidden`) — texto precisa continuar na árvore de acessibilidade
          no mobile pro <select> ter nome acessível, mesmo escondido visualmente. */}
      <span className="sr-only font-semibold nav:not-sr-only nav:inline">Ordenar por</span>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value as Ordenacao)}
        className="rounded-atlas-sm border border-line bg-white px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-blue/40"
      >
        {OPCOES.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}
