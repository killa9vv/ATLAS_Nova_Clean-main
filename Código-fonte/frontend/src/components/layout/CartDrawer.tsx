'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { CLASSES_BOTAO_COMPRAR } from '@/components/ui/botao-comprar';
import { CarrinhoItemImagem } from '@/components/loja/CarrinhoItemImagem';
import { useCart } from '@/lib/cart-context';
import { corDaCategoria, iconeDaCategoria } from '@/lib/categoria-visual';
import { CarrinhoSugestoes } from './CarrinhoSugestoes';

const ATALHOS_CATEGORIA = [
  { slug: 'limpeza', nome: 'Limpeza' },
  { slug: 'descartaveis', nome: 'Descartáveis' },
  { slug: 'papelaria', nome: 'Papelaria' },
];

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Prévia lateral do carrinho — mesmo padrão do site antigo (.cart-drawer + .overlay):
// abre num painel fixo pela direita em vez de navegar pra uma página cheia. A
// página completa de checkout continua reservada pro momento de finalizar de
// verdade (o botão abaixo leva direto pra /checkout).
export function CartDrawer() {
  const router = useRouter();
  const {
    itens,
    itensIndisponiveis,
    total,
    descontoAtacado,
    desconto,
    totalComDesconto,
    cupomCodigo,
    quantidadeTotal,
    hidratado,
    drawerAberto,
    fecharDrawer,
    atualizarQuantidade,
    remover,
  } = useCart();

  const temItemIndisponivel =
    itensIndisponiveis.length > 0 || itens.some((item) => !item.disponivel);
  const temDesconto = descontoAtacado > 0 || (!!cupomCodigo && desconto > 0);

  // Listener global (não local ao <aside>) porque o foco pode estar em qualquer
  // elemento do drawer — um onKeyDown preso só ao container dependeria do evento
  // borbulhar até ele, mais frágil que ouvir no document enquanto está aberto.
  useEffect(() => {
    if (!drawerAberto) return;
    function aoTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') fecharDrawer();
    }
    document.addEventListener('keydown', aoTecla);
    return () => document.removeEventListener('keydown', aoTecla);
  }, [drawerAberto, fecharDrawer]);

  if (!hidratado) return null;

  function irParaCheckout() {
    fecharDrawer();
    router.push('/checkout');
  }

  function removerIndisponiveis() {
    for (const item of itensIndisponiveis) remover(item.produtoId);
    for (const item of itens) if (!item.disponivel) remover(item.produtoId);
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={fecharDrawer}
        className={[
          'fixed inset-0 z-[250] bg-ink/45 transition-opacity duration-300',
          drawerAberto ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sua lista de compras"
        // Fechada, fica fora do Tab (senão o foco cai em botão invisível) e sem sombra (ela
        // vazava pra dentro da tela, como uma faixa cinza na borda direita de toda página).
        inert={!drawerAberto}
        className={[
          'fixed right-0 top-0 z-[260] flex h-full w-[380px] max-w-[92vw] flex-col bg-white transition-transform duration-300 ease-in-out motion-reduce:transition-none',
          drawerAberto ? 'translate-x-0 shadow-atlas-lg' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            Sua lista de compras
            {quantidadeTotal > 0 && (
              <span
                key={quantidadeTotal}
                className="estrela-pop flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1.5 font-mono text-[11px] font-bold text-white"
              >
                {quantidadeTotal}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={fecharDrawer}
            aria-label="Fechar carrinho"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-xl text-muted transition-[background-color,color,rotate] duration-200 hover:rotate-90 hover:bg-sky hover:text-navy motion-reduce:transition-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {itens.length === 0 && itensIndisponiveis.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div>
                <p className="font-display text-lg font-bold text-navy">Sua lista está vazia</p>
                <p className="mt-1 text-[13px] text-muted">Comece por uma categoria:</p>
              </div>
              <ul className="flex w-full list-none flex-col gap-2 p-0">
                {ATALHOS_CATEGORIA.map((categoria) => (
                  <li key={categoria.slug}>
                    <Link
                      href={`/catalogo?categoria=${categoria.slug}`}
                      onClick={fecharDrawer}
                      className="group flex items-center gap-3 rounded-atlas-sm border border-line p-2.5 text-left text-[14px] font-semibold text-navy transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-atlas motion-reduce:transition-none"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                        style={{ background: corDaCategoria(categoria.slug) }}
                      >
                        {iconeDaCategoria(categoria.slug)}
                      </span>
                      <span className="flex-1">{categoria.nome}</span>
                      <span
                        aria-hidden="true"
                        className="text-blue transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/catalogo" onClick={fecharDrawer}>
                <Button size="sm" variant="secondary">
                  Ver catálogo completo
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {temItemIndisponivel && (
                <div className="mb-4 rounded-atlas-sm bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-600">
                  <p>
                    {itensIndisponiveis.length > 0
                      ? `${itensIndisponiveis.map((item) => item.nome ?? 'Um item').join(', ')} não está mais disponível.`
                      : 'Alguns itens têm estoque insuficiente.'}
                  </p>
                  <button
                    type="button"
                    onClick={removerIndisponiveis}
                    className="mt-1.5 font-bold underline hover:no-underline"
                  >
                    Remover indisponíveis
                  </button>
                </div>
              )}
              <div className="flex flex-col">
                {itens.map((item) => (
                  <div
                    key={item.produtoId}
                    className="bolha-chega flex gap-3 border-b border-line py-3.5 first:pt-0 last:border-b-0"
                  >
                    <CarrinhoItemImagem produtoId={item.produtoId} nome={item.nome} tamanho={56} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-navy">
                          {item.nome}
                        </p>
                        <button
                          type="button"
                          onClick={() => remover(item.produtoId)}
                          aria-label={`Remover ${item.nome}`}
                          className="-mr-1.5 -mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] text-muted transition-colors hover:bg-red-50 hover:text-red-600 motion-reduce:transition-none"
                        >
                          ✕
                        </button>
                      </div>
                      {!item.disponivel && (
                        <p className="text-[11px] text-red-600">
                          Só {item.estoqueDisponivel} em estoque.
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                        <Stepper
                          quantidade={item.quantidade}
                          onChange={(q) => atualizarQuantidade(item.produtoId, q)}
                        />
                        <span className="text-right">
                          <span
                            key={item.quantidade}
                            className="estrela-pop font-mono text-[14px] font-bold text-navy"
                          >
                            {formatarMoeda(item.precoUnitario * item.quantidade)}
                          </span>
                          {item.quantidade > 1 && (
                            <span className="block font-mono text-[11px] text-muted">
                              {formatarMoeda(item.precoUnitario)} cada
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <CarrinhoSugestoes ativo={drawerAberto} />
            </>
          )}
        </div>

        {itens.length > 0 && (
          <div className="border-t border-line p-5 shadow-[0_-8px_24px_rgba(11,31,77,0.06)]">
            <div className="mb-3.5 flex flex-col gap-1 text-[13px]">
              {temDesconto && (
                <div className="flex items-center justify-between text-navy">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatarMoeda(total)}</span>
                </div>
              )}
              {descontoAtacado > 0 && (
                <div className="flex items-center justify-between font-semibold text-[#14753c]">
                  <span>Desconto por atacado</span>
                  <span className="font-mono">−{formatarMoeda(descontoAtacado)}</span>
                </div>
              )}
              {!!cupomCodigo && desconto > 0 && (
                <div className="flex items-center justify-between font-semibold text-[#14753c]">
                  <span>Desconto ({cupomCodigo})</span>
                  <span className="font-mono">−{formatarMoeda(desconto)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between text-navy">
                <span className="font-display text-[15px] font-bold">
                  {temDesconto ? 'Total' : 'Subtotal'}
                </span>
                <span
                  key={temDesconto ? totalComDesconto : total}
                  className="estrela-pop font-mono text-[20px] font-bold"
                >
                  {formatarMoeda(temDesconto ? totalComDesconto : total)}
                </span>
              </div>
              <p className="text-[11.5px] text-muted">
                Retirada grátis na loja. Entrega calculada no checkout.
              </p>
            </div>
            <button
              type="button"
              disabled={temItemIndisponivel}
              onClick={irParaCheckout}
              className={`${CLASSES_BOTAO_COMPRAR} mb-1 w-full px-5 py-3.5`}
            >
              Finalizar compra →
            </button>
            <p className="mt-3 text-center text-[11.5px] text-muted">
              Pague online com Pix ou cartão, ou combine pelo WhatsApp.
            </p>
            <Link
              href="/carrinho"
              onClick={fecharDrawer}
              className="mt-1 block py-1 text-center text-[12.5px] font-semibold text-blue hover:underline"
            >
              Ver carrinho completo
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
