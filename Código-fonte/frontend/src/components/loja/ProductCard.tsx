'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { Stepper } from '@/components/ui/Stepper';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { corDaCategoria } from '@/lib/categoria-visual';
import { PrecoProduto } from './PrecoProduto';
import type { Produto } from '@/lib/produtos';

export interface ProductCardProps {
  produto: Produto;
  /** Posição no grid — usada só pra escalonar o delay da animação de entrada, replicando a cascata do site antigo. */
  indice?: number;
}

export function ProductCard({ produto, indice = 0 }: ProductCardProps) {
  const { itens, adicionar, atualizarQuantidade } = useCart();
  const { showToast } = useToast();
  // 0 = tenta a foto real do produto, 1 = cai pro logo da marca, 2 = ícone genérico.
  const [nivelFallback, setNivelFallback] = useState(0);

  const noCarrinho = itens.find((item) => item.produtoId === produto.id);
  const corFundo = corDaCategoria(produto.categoria);
  // Delay escalonado só pros primeiros itens visíveis — evita uma cascata
  // absurdamente longa em grids grandes.
  const delayMs = Math.min(indice, 7) * 30;
  const emPromocao = produto.precoPromocional !== undefined;
  const percentualDesconto = emPromocao
    ? Math.round((1 - produto.precoPromocional! / produto.preco) * 100)
    : 0;

  async function aoAdicionar() {
    await adicionar(produto.id);
    showToast('Adicionado ao carrinho.', 'success');
  }

  // Sem produtoTipo não existe página de detalhe pra linkar (a rota busca por
  // produtoTipoSlug) — cai sem link, só o card informativo de sempre.
  const href = produto.produtoTipo ? `/produtos/${produto.produtoTipo.slug}` : undefined;

  const conteudo = (
    <>
      <div
        className="relative flex aspect-[1.3/1] items-center justify-center overflow-hidden"
        style={{ background: corFundo }}
      >
        <span className="absolute left-2 top-2 rounded-atlas-sm bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
          {produto.categoria ?? 'produto'}
        </span>
        {emPromocao && (
          <Badge variant="amber" className="absolute right-2 top-2">
            -{percentualDesconto}%
          </Badge>
        )}
        {nivelFallback === 0 && produto.imagemPrincipalThumbnailUrl ? (
          <Image
            src={produto.imagemPrincipalThumbnailUrl}
            alt={produto.nome}
            fill
            sizes="(min-width: 1024px) 220px, 45vw"
            className="object-contain p-2"
            onError={() => setNivelFallback(1)}
          />
        ) : nivelFallback <= 1 && produto.marca?.imagemUrl ? (
          <Image
            src={produto.marca.imagemUrl}
            alt={produto.marca.nome}
            width={96}
            height={48}
            className="h-12 w-auto object-contain opacity-70"
            onError={() => setNivelFallback(2)}
          />
        ) : (
          <span className="text-3xl">🧴</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5 pb-0">
        {produto.marca && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-blue">
            {produto.marca.nome}
          </span>
        )}
        <p className="text-[14px] font-semibold leading-snug text-navy">{produto.nome}</p>
        {produto.pack && <p className="text-[12px] text-muted">{produto.pack}</p>}
      </div>
    </>
  );

  return (
    <div
      className="animate-card-in flex flex-col overflow-hidden rounded-atlas border border-line bg-white shadow-atlas transition-transform hover:-translate-y-1 motion-reduce:animate-none"
      style={{ animationDelay: `${delayMs}ms`, borderTopWidth: 3, borderTopColor: '#2e9bf5' }}
    >
      {/* Área clicável (imagem, marca, nome, pack) — fora do Adicionar/Stepper de
          propósito, pra não aninhar <button> dentro de <a>. */}
      {href ? (
        <Link href={href} className="flex flex-1 flex-col">
          {conteudo}
        </Link>
      ) : (
        <div className="flex flex-1 flex-col">{conteudo}</div>
      )}

      <div className="flex items-center justify-between p-3.5 pt-2">
        <PrecoProduto preco={produto.preco} precoPromocional={produto.precoPromocional} />
        {noCarrinho ? (
          <Stepper
            quantidade={noCarrinho.quantidade}
            onChange={(q) => atualizarQuantidade(produto.id, q)}
          />
        ) : (
          <button
            type="button"
            onClick={aoAdicionar}
            disabled={produto.estoque <= 0}
            className="rounded-atlas-sm bg-navy px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-navy-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {produto.estoque <= 0 ? 'Esgotado' : '+ Adicionar'}
          </button>
        )}
      </div>
    </div>
  );
}
