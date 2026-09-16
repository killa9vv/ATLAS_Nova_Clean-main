'use client';

import { useQuery } from '@tanstack/react-query';
import { listarCategorias } from '@/lib/categorias';
import { listarMarcas } from '@/lib/marcas';
import { Button } from '@/components/ui/Button';
import { CatalogoFaixaPreco } from './CatalogoFaixaPreco';
import { temFiltroAtivo, type FiltrosCatalogo } from '@/lib/catalogo-filtros';

export interface CatalogoFiltrosProps {
  filtros: FiltrosCatalogo;
  /** undefined enquanto a primeira página ainda não carregou — o slider aparece
   * assim que os limites reais chegarem. */
  limitesPreco: { min: number; max: number } | undefined;
  aoMudar: (patch: Partial<FiltrosCatalogo>) => void;
  aoLimparTudo: () => void;
}

// Categorias/marcas mudam raramente (cadastro manual do admin) — staleTime longo
// evita refetch a cada abertura do painel de filtros.
const STALE_TIME_MS = 5 * 60_000;

export function CatalogoFiltros({
  filtros,
  limitesPreco,
  aoMudar,
  aoLimparTudo,
}: CatalogoFiltrosProps) {
  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: ({ signal }) => listarCategorias({ ativo: true }, { signal }),
    staleTime: STALE_TIME_MS,
  });
  const { data: marcas } = useQuery({
    queryKey: ['marcas'],
    queryFn: ({ signal }) => listarMarcas({ signal }),
    staleTime: STALE_TIME_MS,
  });

  function alternarCategoria(slug: string) {
    const ativo = filtros.categorias.includes(slug);
    aoMudar({
      categorias: ativo
        ? filtros.categorias.filter((c) => c !== slug)
        : [...filtros.categorias, slug],
    });
  }

  function alternarMarca(id: string) {
    const ativo = filtros.marcas.includes(id);
    aoMudar({ marcas: ativo ? filtros.marcas.filter((m) => m !== id) : [...filtros.marcas, id] });
  }

  return (
    <div className="flex flex-col gap-6">
      {temFiltroAtivo(filtros) && (
        <button
          type="button"
          onClick={aoLimparTudo}
          className="self-start text-[12.5px] font-semibold text-blue hover:underline"
        >
          Limpar todos os filtros
        </button>
      )}

      {categorias && categorias.length > 0 && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-[13px] font-bold text-navy">Categoria</legend>
          {categorias.map((categoria) => (
            <label key={categoria.id} className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={filtros.categorias.includes(categoria.slug)}
                onChange={() => alternarCategoria(categoria.slug)}
                className="h-4 w-4 rounded border-line text-navy focus:ring-blue/40"
              />
              {categoria.nome}
            </label>
          ))}
        </fieldset>
      )}

      {marcas && marcas.length > 0 && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-[13px] font-bold text-navy">Marca</legend>
          <div className="flex max-h-[220px] flex-col gap-2.5 overflow-y-auto pr-1">
            {marcas.map((marca) => (
              <label key={marca.id} className="flex items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={filtros.marcas.includes(marca.id)}
                  onChange={() => alternarMarca(marca.id)}
                  className="h-4 w-4 rounded border-line text-navy focus:ring-blue/40"
                />
                {marca.nome}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-[13px] font-bold text-navy">Preço</legend>
        {limitesPreco ? (
          <CatalogoFaixaPreco
            limiteMin={limitesPreco.min}
            limiteMax={limitesPreco.max}
            valorMin={filtros.precoMin ?? limitesPreco.min}
            valorMax={filtros.precoMax ?? limitesPreco.max}
            onChangeCommitted={(min, max) =>
              aoMudar({
                precoMin: min === limitesPreco.min ? undefined : min,
                precoMax: max === limitesPreco.max ? undefined : max,
              })
            }
          />
        ) : (
          <p className="text-[12px] text-muted">Carregando faixa de preço…</p>
        )}
      </fieldset>

      <label className="flex items-center gap-2 text-[13px] font-semibold text-navy">
        <input
          type="checkbox"
          checked={filtros.disponivel}
          onChange={(e) => aoMudar({ disponivel: e.target.checked })}
          className="h-4 w-4 rounded border-line text-navy focus:ring-blue/40"
        />
        Só produtos em estoque
      </label>
    </div>
  );
}

export function CatalogoFiltrosRodape({ onClose }: { onClose: () => void }) {
  return (
    <Button onClick={onClose} className="mt-2 w-full justify-center">
      Ver resultados
    </Button>
  );
}
