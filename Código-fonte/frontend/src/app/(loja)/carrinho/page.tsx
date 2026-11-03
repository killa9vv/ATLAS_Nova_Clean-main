'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { CarrinhoItemImagem } from '@/components/loja/CarrinhoItemImagem';
import { CupomForm } from '@/components/loja/CupomForm';
import { useCart } from '@/lib/cart-context';

const TRUST_BADGES = [
  { icone: '💳', texto: 'Pix e cartão via Mercado Pago' },
  { icone: '💬', texto: 'Ou combine pelo WhatsApp' },
  { icone: '🏬', texto: 'Retirada grátis na loja' },
];

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CarrinhoPage() {
  const router = useRouter();
  const {
    itens,
    itensIndisponiveis,
    total,
    descontoAtacado,
    desconto,
    totalComDesconto,
    cupomCodigo,
    hidratado,
    atualizarQuantidade,
    remover,
    limpar,
  } = useCart();

  const temItemIndisponivel =
    itensIndisponiveis.length > 0 || itens.some((item) => !item.disponivel);

  // Espera hidratar antes de decidir "vazio" — logo após montar, o carrinho ainda
  // não terminou de carregar do servidor (ver CartProvider), senão um reload desta
  // página com carrinho não vazio mostraria "carrinho vazio" por um instante.
  if (!hidratado) {
    return null;
  }

  if (itens.length === 0 && itensIndisponiveis.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="mb-3 font-display text-2xl font-bold text-navy">Seu carrinho está vazio</h1>
        <p className="mb-6 text-muted">Adicione produtos do catálogo pra continuar.</p>
        <Link href="/catalogo">
          <Button>Ver catálogo</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-10">
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">Sua lista de compras</h1>

      <div className="grid gap-8 nav:grid-cols-[1fr_340px]">
        {/* Lista de itens */}
        <div className="overflow-hidden rounded-atlas border border-line bg-white shadow-atlas">
          {itensIndisponiveis.length > 0 && (
            <p className="m-4 rounded-atlas-sm bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {itensIndisponiveis.map((item) => item.nome ?? 'Um item').join(', ')} não está mais
              disponível — remova pra continuar.
            </p>
          )}

          <div className="flex flex-col px-4">
            {itensIndisponiveis.map((item) => (
              <div
                key={item.produtoId}
                className="flex items-center justify-between gap-3 border-b border-dashed border-line py-4 last:border-b-0 opacity-60"
              >
                <p className="truncate text-[13.5px] font-semibold text-navy">
                  {item.nome ?? 'Produto indisponível'}
                </p>
                <button
                  type="button"
                  onClick={() => remover(item.produtoId)}
                  aria-label={`Remover ${item.nome ?? 'produto'}`}
                  className="shrink-0 text-muted hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            {itens.map((item) => (
              <div
                key={item.produtoId}
                className="flex items-center gap-3 border-b border-dashed border-line py-4 last:border-b-0"
              >
                <CarrinhoItemImagem produtoId={item.produtoId} nome={item.nome} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-navy">{item.nome}</p>
                  <p className="font-mono text-[12px] text-muted">
                    {formatarMoeda(item.precoUnitario)}
                  </p>
                  {!item.disponivel && (
                    <p className="text-[11.5px] text-red-600">
                      Só {item.estoqueDisponivel} em estoque.
                    </p>
                  )}
                </div>
                <Stepper
                  quantidade={item.quantidade}
                  onChange={(q) => atualizarQuantidade(item.produtoId, q)}
                />
                <span className="w-20 shrink-0 text-right font-mono text-[13.5px] font-bold text-navy">
                  {formatarMoeda(item.subtotal)}
                </span>
                <button
                  type="button"
                  onClick={() => remover(item.produtoId)}
                  aria-label={`Remover ${item.nome}`}
                  className="shrink-0 text-muted hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-line px-4 py-3.5">
            <button
              type="button"
              onClick={limpar}
              className="text-[13px] font-semibold text-muted hover:text-red-600"
            >
              Limpar carrinho
            </button>
          </div>
        </div>

        {/* Resumo — sticky no desktop, sempre visível independente do tamanho da lista. */}
        <div className="nav:sticky nav:top-[90px] nav:self-start">
          <div className="flex flex-col gap-4 rounded-atlas border border-line bg-white p-5 shadow-atlas">
            <h2 className="font-display text-base font-bold text-navy">Resumo do pedido</h2>

            <CupomForm />

            <div className="flex flex-col gap-1.5 border-t border-line pt-4 text-[13px]">
              <div className="flex items-center justify-between text-navy">
                <span>Subtotal</span>
                <span className="font-mono">{formatarMoeda(total)}</span>
              </div>
              {descontoAtacado > 0 && (
                <div className="flex items-center justify-between text-green">
                  <span>Desconto por atacado</span>
                  <span className="font-mono">−{formatarMoeda(descontoAtacado)}</span>
                </div>
              )}
              {!!cupomCodigo && desconto > 0 && (
                <div className="flex items-center justify-between text-green">
                  <span>Desconto ({cupomCodigo})</span>
                  <span className="font-mono">−{formatarMoeda(desconto)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-muted">
                <span>Frete</span>
                <span>Calculado no checkout</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-dashed border-line pt-2.5 font-display text-base font-bold text-navy">
                <span>Total</span>
                <span className="font-mono">
                  {formatarMoeda(cupomCodigo || descontoAtacado > 0 ? totalComDesconto : total)}
                </span>
              </div>
            </div>

            <Button
              className="w-full justify-center"
              disabled={temItemIndisponivel || itens.length === 0}
              onClick={() => router.push('/checkout')}
            >
              Continuar para o checkout
            </Button>

            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge.texto}
                  className="flex items-center gap-1.5 text-[11px] text-muted"
                >
                  <span aria-hidden="true">{badge.icone}</span>
                  {badge.texto}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
