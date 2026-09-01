'use client';

import { useMemo, useState } from 'react';
import { ProductCard } from './ProductCard';
import { ProductTypeCard } from './ProductTypeCard';
import type { Produto } from '@/lib/produtos';

const VISIVEL_INICIAL = 8;

export interface CategoryGridProps {
  produtos: Produto[];
}

interface GrupoProduto {
  chave: string;
  variantes: Produto[];
}

// Agrupa por tipo de produto (ex: "Detergente para Louça") — produto sem
// produtoTipo vinculado (ex: cadastrado direto pelo admin, sem passar pelo import)
// cai num grupo de 1 usando o próprio id, mesmo efeito visual do card simples de hoje.
function agruparPorTipo(produtos: Produto[]): GrupoProduto[] {
  const grupos = new Map<string, Produto[]>();
  for (const produto of produtos) {
    const chave = produto.produtoTipo?.slug ?? produto.id;
    const lista = grupos.get(chave) ?? [];
    lista.push(produto);
    grupos.set(chave, lista);
  }
  return [...grupos.entries()].map(([chave, variantes]) => ({ chave, variantes }));
}

export function CategoryGrid({ produtos }: CategoryGridProps) {
  const [marcaAtiva, setMarcaAtiva] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(false);

  const marcas = useMemo(() => {
    const nomes = new Set(produtos.map((p) => p.marca?.nome).filter(Boolean) as string[]);
    return [...nomes].sort((a, b) => a.localeCompare(b));
  }, [produtos]);

  // Com marca ativa cada tipo tem no máximo 1 variante daquela marca — não faz
  // sentido agrupar, mostra a variante direto (mesmo card simples de sempre).
  const filtrados = marcaAtiva ? produtos.filter((p) => p.marca?.nome === marcaAtiva) : produtos;
  const grupos = marcaAtiva ? null : agruparPorTipo(filtrados);

  const totalCards = marcaAtiva ? filtrados.length : (grupos?.length ?? 0);
  const cardsVisiveis = expandido ? totalCards : Math.min(totalCards, VISIVEL_INICIAL);

  return (
    <div>
      {marcas.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMarcaAtiva(null)}
            className={[
              'rounded-full border px-3 py-1.5 text-[12px] font-semibold',
              marcaAtiva === null
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-white text-navy hover:bg-sky',
            ].join(' ')}
          >
            Todas
          </button>
          {marcas.map((marca) => (
            <button
              key={marca}
              type="button"
              onClick={() => setMarcaAtiva(marca)}
              className={[
                'rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                marcaAtiva === marca
                  ? 'border-navy bg-navy text-white'
                  : 'border-line bg-white text-navy hover:bg-sky',
              ].join(' ')}
            >
              {marca}
            </button>
          ))}
        </div>
      )}

      {totalCards === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">Nenhum produto encontrado.</p>
      ) : (
        <div
          className="grid gap-[18px]"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
        >
          {marcaAtiva
            ? filtrados
                .slice(0, cardsVisiveis)
                .map((produto, i) => <ProductCard key={produto.id} produto={produto} indice={i} />)
            : grupos!.slice(0, cardsVisiveis).map((grupo, i) => {
                if (grupo.variantes.length === 1) {
                  return <ProductCard key={grupo.chave} produto={grupo.variantes[0]} indice={i} />;
                }
                const precoMinimo = Math.min(...grupo.variantes.map((v) => v.preco));
                const primeira = grupo.variantes[0];
                const marcasDistintas = new Set(
                  grupo.variantes.map((v) => v.marca?.nome).filter(Boolean),
                ).size;
                return (
                  <ProductTypeCard
                    key={grupo.chave}
                    slug={grupo.chave}
                    nome={primeira.produtoTipo?.nome ?? primeira.nome}
                    categoria={primeira.categoria}
                    quantidadeVariantes={grupo.variantes.length}
                    quantidadeMarcas={marcasDistintas}
                    precoMinimo={precoMinimo}
                    produtoRepresentativoId={primeira.id}
                    indice={i}
                  />
                );
              })}
        </div>
      )}

      {!expandido && totalCards > VISIVEL_INICIAL && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setExpandido(true)}
            className="rounded-atlas-sm border border-line bg-white px-4 py-2 text-[13px] font-semibold text-navy hover:bg-sky"
          >
            Ver mais {totalCards - VISIVEL_INICIAL} produtos
          </button>
        </div>
      )}
    </div>
  );
}
