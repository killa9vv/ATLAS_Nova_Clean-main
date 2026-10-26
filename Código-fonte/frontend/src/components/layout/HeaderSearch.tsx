'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import { listarProdutos } from '@/lib/produtos';
import { PrecoProduto } from '@/components/loja/PrecoProduto';

const ATRASO_MS = 300;
const LIMITE_SUGESTOES = 5;
const TAMANHO_MINIMO_BUSCA = 2;

// Autocomplete do campo de busca do header: sugere produtos reais enquanto
// digita (debounced), sem abandonar o comportamento antigo de Enter/submit
// levar pro catálogo com o termo na URL.
export function HeaderSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState('');
  const [aberto, setAberto] = useState(false);
  const textoComAtraso = useDebounce(texto, ATRASO_MS);
  const buscaValida = textoComAtraso.trim().length >= TAMANHO_MINIMO_BUSCA;

  const { data, isFetching } = useQuery({
    queryKey: ['busca-header', textoComAtraso],
    queryFn: () => listarProdutos({ pagina: 1, limite: LIMITE_SUGESTOES, busca: textoComAtraso }),
    enabled: buscaValida,
    staleTime: 30_000,
  });

  const sugestoes = buscaValida ? (data?.itens ?? []) : [];
  const mostrarPainel = aberto && buscaValida;

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      if (!containerRef.current?.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, []);

  function irParaCatalogo(termo: string) {
    setAberto(false);
    router.push(`/catalogo?q=${encodeURIComponent(termo)}`);
  }

  return (
    <div ref={containerRef} className="relative hidden nav:block">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim()) irParaCatalogo(texto.trim());
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-[11px] top-[9px] h-3.5 w-3.5 stroke-muted"
        >
          <circle cx="11" cy="11" r="7" strokeWidth="2" />
          <path d="M21 21l-4-4" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          name="q"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setAberto(false);
          }}
          placeholder="Buscar produto..."
          role="combobox"
          aria-expanded={mostrarPainel}
          aria-controls="header-search-sugestoes"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-[180px] rounded-[20px] border border-line bg-white py-2 pl-[34px] pr-3 font-sans text-[13px]"
        />
      </form>

      {mostrarPainel && (
        <div
          id="header-search-sugestoes"
          role="listbox"
          className="absolute left-0 top-[calc(100%+8px)] z-[200] w-[320px] overflow-hidden rounded-atlas border border-line bg-white shadow-atlas-lg"
        >
          {isFetching && sugestoes.length === 0 ? (
            <p className="px-4 py-3 text-[12.5px] text-muted">Buscando…</p>
          ) : sugestoes.length === 0 ? (
            <p className="px-4 py-3 text-[12.5px] text-muted">
              Nenhum produto encontrado para &quot;{textoComAtraso}&quot;.
            </p>
          ) : (
            <ul>
              {sugestoes.map((produto) => (
                <li key={produto.id} role="option" aria-selected={false}>
                  <Link
                    href={
                      produto.produtoTipo
                        ? `/produtos/${produto.produtoTipo.slug}`
                        : `/catalogo?q=${encodeURIComponent(produto.nome)}`
                    }
                    onClick={() => setAberto(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-sky"
                  >
                    <span className="min-w-0">
                      {produto.marca && (
                        <span className="block text-[10.5px] font-bold uppercase tracking-wide text-blue">
                          {produto.marca.nome}
                        </span>
                      )}
                      <span className="block truncate text-[13px] font-semibold text-navy">
                        {produto.nome}
                      </span>
                    </span>
                    <PrecoProduto
                      preco={produto.preco}
                      precoPromocional={produto.precoPromocional}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => irParaCatalogo(textoComAtraso)}
            className="block w-full border-t border-line px-4 py-2.5 text-left text-[12.5px] font-bold text-blue hover:bg-sky"
          >
            Ver todos os resultados para &quot;{textoComAtraso}&quot; →
          </button>
        </div>
      )}
    </div>
  );
}
