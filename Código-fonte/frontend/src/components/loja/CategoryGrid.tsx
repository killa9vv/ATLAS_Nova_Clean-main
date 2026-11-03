'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEntradaNaTela } from '@/hooks/use-entrada-na-tela';
import { CLASSES_CARDS_VIVOS, ProductCard } from './ProductCard';
import { ProductTypeCard } from './ProductTypeCard';
import type { Produto } from '@/lib/produtos';

const VISIVEL_INICIAL = 8;
const LIMIAR_ENTRADA = 0.05;

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
  const { ref, entrada } = useEntradaNaTela<HTMLDivElement>(LIMIAR_ENTRADA);
  const filtrosRef = useRef<HTMLDivElement>(null);
  const pilulaRef = useRef<HTMLSpanElement>(null);

  const marcas = useMemo(() => {
    const nomes = new Set(produtos.map((p) => p.marca?.nome).filter(Boolean) as string[]);
    return [...nomes].sort((a, b) => a.localeCompare(b));
  }, [produtos]);

  // Pílula que desliza até o filtro ativo. Até ela estar posicionada (data-pronta), o próprio
  // botão ativo pinta o fundo: sem JS ou antes dele carregar, o filtro continua legível.
  useEffect(() => {
    const filtros = filtrosRef.current;
    const pilula = pilulaRef.current;
    if (!filtros || !pilula) return;

    function posicionar() {
      const ativo = filtros!.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!ativo) return;
      pilula!.style.left = `${ativo.offsetLeft}px`;
      pilula!.style.top = `${ativo.offsetTop}px`;
      pilula!.style.width = `${ativo.offsetWidth}px`;
      pilula!.style.height = `${ativo.offsetHeight}px`;
      filtros!.dataset.pronta = 'true';
    }

    posicionar();
    // A largura dos botões muda quando a fonte termina de carregar e a fileira quebra diferente.
    document.fonts?.ready.then(posicionar);
    const observador = new ResizeObserver(posicionar);
    observador.observe(filtros);
    return () => observador.disconnect();
  }, [marcaAtiva]);

  // Com marca ativa cada tipo tem no máximo 1 variante daquela marca — não faz
  // sentido agrupar, mostra a variante direto (mesmo card simples de sempre).
  const filtrados = marcaAtiva ? produtos.filter((p) => p.marca?.nome === marcaAtiva) : produtos;
  const grupos = marcaAtiva ? null : agruparPorTipo(filtrados);

  const totalCards = marcaAtiva ? filtrados.length : (grupos?.length ?? 0);
  const cardsVisiveis = expandido ? totalCards : Math.min(totalCards, VISIVEL_INICIAL);

  const classeEntrada =
    entrada === 'aguardando' ? 'opacity-0' : entrada === 'entrando' ? 'animate-card-in' : '';

  function classesFiltro(ativo: boolean) {
    return [
      'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-[translate,scale,color,background-color] duration-300 hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none',
      classeEntrada,
      ativo
        ? 'relative z-20 border-navy bg-navy text-white group-data-[pronta]/filtros:border-transparent group-data-[pronta]/filtros:bg-transparent'
        : 'border-line bg-white text-navy hover:bg-sky',
    ].join(' ');
  }

  function atrasoCascata(indice: number, passoMs: number) {
    return entrada === 'entrando' ? { animationDelay: `${indice * passoMs}ms` } : undefined;
  }

  return (
    <div ref={ref}>
      {marcas.length > 1 && (
        <div ref={filtrosRef} className="group/filtros relative mb-4 flex flex-wrap gap-2">
          <span
            ref={pilulaRef}
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 hidden rounded-full bg-navy group-data-[pronta]/filtros:block group-data-[pronta]/filtros:transition-[left,top,width,height] group-data-[pronta]/filtros:duration-300 group-data-[pronta]/filtros:ease-out motion-reduce:transition-none ${entrada === 'aguardando' ? 'opacity-0' : ''}`}
          />
          <button
            type="button"
            aria-pressed={marcaAtiva === null}
            onClick={() => setMarcaAtiva(null)}
            className={classesFiltro(marcaAtiva === null)}
          >
            Todas
          </button>
          {marcas.map((marca, indice) => (
            <button
              key={marca}
              type="button"
              aria-pressed={marcaAtiva === marca}
              onClick={() => setMarcaAtiva(marca)}
              className={classesFiltro(marcaAtiva === marca)}
              style={atrasoCascata(Math.min(indice + 1, 14), 25)}
            >
              {marca}
            </button>
          ))}
        </div>
      )}

      {totalCards === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted">Nenhum produto encontrado.</p>
      ) : (
        // A key refaz a grade a cada filtro: os cards voltam a entrar em cascata.
        <div
          key={marcaAtiva ?? 'todas'}
          className={`grid gap-3.5 ${CLASSES_CARDS_VIVOS}`}
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}
        >
          {(marcaAtiva
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
                    imagemThumbnailUrl={primeira.imagemPrincipalThumbnailUrl}
                    indice={i}
                  />
                );
              })
          ).map((card, i) => (
            // flex + *:w-full: os cards de uma mesma fileira ficam com a mesma altura.
            <div
              key={card.key}
              className={`flex *:w-full ${classeEntrada}`}
              style={atrasoCascata(Math.min(i, 7), 70)}
            >
              {card}
            </div>
          ))}
        </div>
      )}

      {!expandido && totalCards > VISIVEL_INICIAL && (
        <div className={`mt-5 flex justify-center ${entrada === 'aguardando' ? 'opacity-0' : ''}`}>
          <button
            type="button"
            onClick={() => setExpandido(true)}
            className="rounded-atlas-sm border border-line bg-white px-4 py-2 text-[13px] font-semibold text-navy transition-[translate,scale,background-color] duration-200 hover:-translate-y-0.5 hover:bg-sky active:scale-95 motion-reduce:transition-none"
          >
            Ver mais {totalCards - VISIVEL_INICIAL} produtos
          </button>
        </div>
      )}
    </div>
  );
}
