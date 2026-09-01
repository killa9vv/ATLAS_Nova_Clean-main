'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/components/ui/Toast';
import { BackButton } from './BackButton';
import { useImagemPrincipal } from '@/hooks/use-imagem-principal';
import { CATEGORY_INFO, type Category } from '@/data/products';
import type { Produto } from '@/lib/produtos';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface ProdutoDetalheProps {
  variantes: Produto[];
}

// Réplica da tela de detalhe do site antigo: seletor de marca/embalagem (cada
// "variante" é uma linha de Produto real), preço da variante escolhida, e o texto
// padrão de informações técnicas/precauções por categoria (nenhuma variante real
// tem texto próprio hoje — mesmo fallback que o site antigo já usava).
export function ProdutoDetalhe({ variantes }: ProdutoDetalheProps) {
  const { adicionar, itens, atualizarQuantidade } = useCart();
  const { showToast } = useToast();
  const [selecionadoId, setSelecionadoId] = useState(variantes[0].id);

  const selecionado = variantes.find((v) => v.id === selecionadoId) ?? variantes[0];
  const noCarrinho = itens.find((item) => item.produtoId === selecionado.id);
  const categoryInfo = CATEGORY_INFO[selecionado.categoria as Category];
  const { principal: imagemProduto } = useImagemPrincipal(selecionado.id);

  function aoAdicionar() {
    adicionar(selecionado.id, selecionado.nome, selecionado.preco, 1);
    showToast('Adicionado ao carrinho.', 'success');
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10">
      <BackButton />
      <div className="grid gap-8 nav:grid-cols-2">
        <div className="flex items-center justify-center overflow-hidden rounded-atlas border border-line bg-sky">
          {imagemProduto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagemProduto.url}
              alt={selecionado.nome}
              className="h-full max-h-[420px] w-full object-contain p-6"
            />
          ) : selecionado.marca?.imagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selecionado.marca.imagemUrl}
              alt={selecionado.marca.nome}
              className="h-24 w-auto object-contain p-10 opacity-70"
            />
          ) : (
            <span className="p-10 text-6xl opacity-60" aria-hidden="true">
              🧴
            </span>
          )}
        </div>

        <div>
          <span className="mb-1 inline-block rounded-atlas-sm bg-sky px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-navy">
            {selecionado.categoria}
          </span>
          <h1 className="font-display text-2xl font-bold text-navy">{selecionado.nome}</h1>
          {selecionado.pack && <p className="mt-1 text-[13px] text-muted">{selecionado.pack}</p>}

          <label className="mt-5 block text-[13px] font-semibold text-navy">
            Escolha a marca
            <select
              value={selecionadoId}
              onChange={(e) => setSelecionadoId(e.target.value)}
              className="mt-1.5 w-full rounded-atlas-sm border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-blue/40"
            >
              {variantes.map((variante) => (
                <option key={variante.id} value={variante.id}>
                  {variante.marca?.nome ?? 'Genérico'} — {variante.pack ?? variante.nome}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 flex items-center justify-between rounded-atlas border border-line bg-white p-4 shadow-atlas">
            <span className="font-mono text-2xl font-bold text-navy">
              {formatarMoeda(selecionado.preco)}
            </span>
            {noCarrinho ? (
              <div className="inline-flex items-center gap-2.5 rounded-atlas-sm border border-line bg-white px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => atualizarQuantidade(selecionado.id, noCarrinho.quantidade - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-atlas-sm text-navy hover:bg-sky"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <span className="min-w-5 text-center text-[13px] font-semibold text-ink">
                  {noCarrinho.quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => atualizarQuantidade(selecionado.id, noCarrinho.quantidade + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-atlas-sm text-navy hover:bg-sky"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={aoAdicionar}
                disabled={selecionado.estoque <= 0}
                className="rounded-atlas-sm bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selecionado.estoque <= 0 ? 'Esgotado' : '+ Adicionar'}
              </button>
            )}
          </div>

          {categoryInfo && (
            <div className="mt-6 flex flex-col gap-4">
              <div>
                <h2 className="mb-1 font-display text-sm font-bold text-navy">
                  Informações técnicas
                </h2>
                <p className="text-[13px] leading-relaxed text-muted">{categoryInfo.info}</p>
              </div>
              <div>
                <h2 className="mb-1 font-display text-sm font-bold text-navy">Precauções de uso</h2>
                <p className="text-[13px] leading-relaxed text-muted">{categoryInfo.precautions}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
