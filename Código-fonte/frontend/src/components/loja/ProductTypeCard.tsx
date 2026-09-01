'use client';

import Link from 'next/link';
import { useImagemPrincipal } from '@/hooks/use-imagem-principal';

const COR_POR_CATEGORIA: Record<string, string> = {
  limpeza: '#EAF4FF',
  descartaveis: '#FFF3E0',
  papelaria: '#EAF7EF',
};

const ICONE_POR_CATEGORIA: Record<string, string> = {
  limpeza: '🧴',
  descartaveis: '🥤',
  papelaria: '📎',
};

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface ProductTypeCardProps {
  slug: string;
  nome: string;
  categoria?: string;
  /** Quantas linhas (marca+embalagem) o tipo tem no total. */
  quantidadeVariantes: number;
  /** Quantas marcas DISTINTAS entre essas variantes — numa página já filtrada por
   * uma marca, isso é sempre 1 mesmo com várias embalagens/aromas da mesma marca. */
  quantidadeMarcas: number;
  precoMinimo: number;
  /** Id de uma das variantes do grupo (a primeira) — usado só pra buscar uma foto
   * real pra representar o card, se existir. */
  produtoRepresentativoId: string;
  indice?: number;
}

// Card "de leque" — quando um tipo de produto (ex: "Detergente para Louça") tem mais
// de uma marca disponível, mostra um card só (sem logo de marca nenhuma, já que
// representa várias) com o menor preço e leva pra página de detalhe, onde dá pra
// escolher a marca/embalagem. Mesmo padrão do site antigo (groupCard).
export function ProductTypeCard({
  slug,
  nome,
  categoria,
  quantidadeVariantes,
  quantidadeMarcas,
  precoMinimo,
  produtoRepresentativoId,
  indice = 0,
}: ProductTypeCardProps) {
  const corFundo = COR_POR_CATEGORIA[categoria ?? ''] ?? '#EAF4FF';
  const icone = ICONE_POR_CATEGORIA[categoria ?? ''] ?? '🧴';
  const delayMs = Math.min(indice, 7) * 30;
  const { principal: imagemProduto } = useImagemPrincipal(produtoRepresentativoId);

  return (
    <Link
      href={`/produtos/${slug}`}
      className="animate-card-in flex flex-col overflow-hidden rounded-atlas border border-line bg-white shadow-atlas transition-transform hover:-translate-y-1 motion-reduce:animate-none"
      style={{ animationDelay: `${delayMs}ms`, borderTopWidth: 3, borderTopColor: '#2e9bf5' }}
    >
      <div
        className="relative flex aspect-[1.3/1] items-center justify-center overflow-hidden"
        style={{ background: corFundo }}
      >
        <span className="absolute left-2 top-2 rounded-atlas-sm bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
          {categoria ?? 'produto'}
        </span>
        {imagemProduto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagemProduto.thumbnailUrl} alt={nome} className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl opacity-70" aria-hidden="true">
            {icone}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <p className="text-[14px] font-semibold leading-snug text-navy">{nome}</p>
        <p className="text-[12px] text-muted">
          {quantidadeMarcas > 1
            ? `${quantidadeMarcas} marcas disponíveis`
            : `${quantidadeVariantes} opções disponíveis`}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex flex-col">
            <span className="text-[10px] text-muted">a partir de</span>
            <span className="font-mono text-[14px] font-bold text-navy">
              {formatarMoeda(precoMinimo)}
            </span>
          </span>
          <span className="rounded-atlas-sm bg-navy px-3 py-1.5 text-[12px] font-semibold text-white">
            Ver opções →
          </span>
        </div>
      </div>
    </Link>
  );
}
