'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listarProdutos } from '@/lib/produtos';
import {
  filtrosDaUrl,
  filtrosParaUrl,
  paraParametrosApi,
  temFiltroAtivo,
  FILTROS_VAZIOS,
  type FiltrosCatalogo,
  type Ordenacao,
} from '@/lib/catalogo-filtros';
import { CatalogoBusca } from './CatalogoBusca';
import { CatalogoFiltros, CatalogoFiltrosRodape } from './CatalogoFiltros';
import { CatalogoOrdenacao } from './CatalogoOrdenacao';
import { CatalogoResultados } from './CatalogoResultados';
import { CatalogoPaginacao } from './CatalogoPaginacao';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const ITENS_POR_PAGINA = 24;
// Estoque/preço/ativo mudam via admin a qualquer momento — sem cache pesado.
const STALE_TIME_MS = 30_000;

export function CatalogoPagina() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtrosModalAberto, setFiltrosModalAberto] = useState(false);

  const filtros = filtrosDaUrl(searchParams);

  function escreverUrl(novo: FiltrosCatalogo) {
    const query = filtrosParaUrl(novo);
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function aoMudarFiltro(patch: Partial<FiltrosCatalogo>) {
    // Qualquer mudança de filtro/busca/ordenação reseta pra página 1 — silenciosamente
    // ficar na página 5 de um recorte novo (que pode ter só 2 páginas) confundiria.
    escreverUrl({ ...filtros, ...patch, pagina: 1 });
  }

  function aoMudarPagina(pagina: number) {
    escreverUrl({ ...filtros, pagina });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function aoLimparTudo() {
    escreverUrl(FILTROS_VAZIOS);
    setFiltrosModalAberto(false);
  }

  const { ordenarPor, direcao } = paraParametrosApi(filtros.ordenacao);

  const { data, isFetching, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'produtos-catalogo',
      filtros.q,
      filtros.categorias,
      filtros.marcas,
      filtros.precoMin,
      filtros.precoMax,
      filtros.disponivel,
      filtros.ordenacao,
      filtros.pagina,
    ],
    queryFn: ({ signal }) =>
      listarProdutos(
        {
          pagina: filtros.pagina,
          limite: ITENS_POR_PAGINA,
          busca: filtros.q || undefined,
          categorias: filtros.categorias,
          marcaIds: filtros.marcas,
          precoMin: filtros.precoMin,
          precoMax: filtros.precoMax,
          disponivel: filtros.disponivel,
          ordenarPor,
          direcao,
          fotoPrimeiro: filtros.ordenacao === 'relevancia',
        },
        { signal },
      ),
    staleTime: STALE_TIME_MS,
    // Mantém os dados da combinação de filtros anterior visíveis (e os limites de
    // preço estáveis, sem o slider sumir) enquanto a nova busca carrega — só a grid
    // troca pra skeleton (via isFetching, não isLoading) nesse meio-tempo.
    placeholderData: keepPreviousData,
  });

  const limitesPreco =
    data?.precoMinCatalogo !== undefined && data?.precoMaxCatalogo !== undefined
      ? { min: data.precoMinCatalogo, max: data.precoMaxCatalogo }
      : undefined;

  const filtrosProps = {
    filtros,
    limitesPreco,
    aoMudar: aoMudarFiltro,
    aoLimparTudo,
  };

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-10">
      <h1 className="mb-1 font-display text-2xl font-bold text-navy">
        {filtros.q ? `Resultados para "${filtros.q}"` : 'Catálogo completo'}
      </h1>
      <p className="mb-6 text-[13px] text-muted">
        {isLoading ? 'Carregando…' : `${data?.total ?? 0} produtos`}
      </p>

      <div className="mb-6 max-w-md">
        <CatalogoBusca valor={filtros.q} aoMudar={(q) => aoMudarFiltro({ q })} />
      </div>

      <div className="grid gap-8 nav:grid-cols-[220px_1fr]">
        <aside className="hidden nav:block">
          <CatalogoFiltros {...filtrosProps} />
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="nav:hidden"
              onClick={() => setFiltrosModalAberto(true)}
            >
              Filtros{temFiltroAtivo(filtros) ? ' •' : ''}
            </Button>
            <div className="ml-auto">
              <CatalogoOrdenacao
                valor={filtros.ordenacao}
                aoMudar={(ordenacao: Ordenacao) => aoMudarFiltro({ ordenacao })}
              />
            </div>
          </div>

          <CatalogoResultados
            produtos={data?.itens}
            isLoading={isFetching}
            isError={isError}
            temFiltroAtivo={temFiltroAtivo(filtros)}
            aoLimparFiltros={aoLimparTudo}
            aoTentarNovamente={() => refetch()}
          />

          <CatalogoPaginacao
            paginaAtual={filtros.pagina}
            totalPaginas={data?.totalPaginas ?? 1}
            aoMudar={aoMudarPagina}
          />
        </div>
      </div>

      <Modal open={filtrosModalAberto} onClose={() => setFiltrosModalAberto(false)} title="Filtros">
        <CatalogoFiltros {...filtrosProps} />
        <CatalogoFiltrosRodape onClose={() => setFiltrosModalAberto(false)} />
      </Modal>
    </main>
  );
}
