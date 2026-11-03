'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CarrinhoItemImagem } from '@/components/loja/CarrinhoItemImagem';
import { useToast } from '@/components/ui/Toast';
import { useCart } from '@/lib/cart-context';
import { ApiError } from '@/lib/http';
import { buscarProduto, listarProdutos } from '@/lib/produtos';

const QUANTIDADE_SUGESTOES = 3;
const LIMITE_BUSCA = 40;
const VALIDADE_CACHE_MS = 5 * 60 * 1000;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Sem endpoint de recomendação, sugere o que há de outro tipo na mesma categoria do primeiro
// item, sempre com estoque. Só busca com a gaveta aberta. Se a busca falhar, o bloco
// simplesmente não aparece: não pode atrapalhar quem já está indo pagar.
export function CarrinhoSugestoes({ ativo }: { ativo: boolean }) {
  const { itens, adicionar } = useCart();
  const { showToast } = useToast();
  const [adicionandoId, setAdicionandoId] = useState<string | null>(null);
  const primeiroId = itens[0]?.produtoId;

  const { data: base } = useQuery({
    queryKey: ['produto', primeiroId],
    queryFn: () => buscarProduto(primeiroId),
    enabled: ativo && !!primeiroId,
    staleTime: VALIDADE_CACHE_MS,
  });
  const categoria = base?.categoria;
  const { data: daCategoria } = useQuery({
    queryKey: ['sugestoes-carrinho', categoria],
    queryFn: () => listarProdutos({ pagina: 1, limite: LIMITE_BUSCA, categoria }),
    enabled: ativo && !!categoria,
    staleTime: VALIDADE_CACHE_MS,
  });

  // Pelo nome: o item do carrinho não traz o tipo, e outra marca do mesmo produto não é sugestão.
  const nomesNoCarrinho = new Set(itens.map((item) => item.nome));
  const tiposVistos = new Set([base?.produtoTipo?.slug]);
  const sugestoes = (daCategoria?.itens ?? [])
    .filter((produto) => {
      if (nomesNoCarrinho.has(produto.nome) || produto.estoque <= 0) return false;
      const tipo = produto.produtoTipo?.slug;
      if (tipo && tiposVistos.has(tipo)) return false;
      tiposVistos.add(tipo);
      return true;
    })
    .slice(0, QUANTIDADE_SUGESTOES);

  if (sugestoes.length === 0) return null;

  async function aoAdicionar(produtoId: string) {
    setAdicionandoId(produtoId);
    try {
      await adicionar(produtoId);
    } catch (erro) {
      showToast(
        erro instanceof ApiError
          ? erro.message
          : 'Não foi possível adicionar agora. Tente de novo.',
        'error',
      );
    } finally {
      setAdicionandoId(null);
    }
  }

  return (
    <section aria-label="Sugestões" className="mt-5">
      <h3 className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-blue">
        Aproveite e leve também
      </h3>
      <ul className="flex list-none flex-col gap-2 p-0">
        {sugestoes.map((produto) => {
          const preco = produto.precoPromocional ?? produto.preco;
          return (
            <li
              key={produto.id}
              className="flex items-center gap-2.5 rounded-atlas-sm border border-line p-2"
            >
              <CarrinhoItemImagem produtoId={produto.id} nome={produto.nome} tamanho={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-navy">{produto.nome}</p>
                <p className="truncate text-[11.5px] text-muted">
                  <span className="font-mono font-semibold text-navy">{formatarMoeda(preco)}</span>
                  {produto.marca && ` · ${produto.marca.nome}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => aoAdicionar(produto.id)}
                disabled={adicionandoId !== null}
                aria-label={`Adicionar ${produto.nome}`}
                className="h-9 shrink-0 rounded-atlas-sm border border-navy px-2.5 text-[12px] font-bold text-navy transition-[background-color,scale] hover:bg-sky active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              >
                {adicionandoId === produto.id ? '...' : '+ Adicionar'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
