'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { useCart } from '@/lib/cart-context';

const TRUST_BADGES = [
  { icone: '⚡', texto: 'Resposta rápida' },
  { icone: '💳', texto: 'Pix, cartão ou combinado' },
  { icone: '🔒', texto: 'Sem pagamento adiantado' },
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
    hidratado,
    drawerAberto,
    fecharDrawer,
    atualizarQuantidade,
    remover,
  } = useCart();

  const temItemIndisponivel = itensIndisponiveis.length > 0 || itens.some((item) => !item.disponivel);

  if (!hidratado) return null;

  function irParaCheckout() {
    fecharDrawer();
    router.push('/checkout');
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
        className={[
          'fixed right-0 top-0 z-[260] flex h-full w-[380px] max-w-[92vw] flex-col bg-white shadow-atlas-lg transition-transform duration-300 ease-in-out',
          drawerAberto ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b-2 border-dashed border-line p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            Sua lista de compras
            {itens.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1.5 font-mono text-[11px] font-bold text-white">
                {itens.length}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={fecharDrawer}
            aria-label="Fechar carrinho"
            className="text-xl text-muted hover:text-navy"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {itens.length === 0 && itensIndisponiveis.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-[13.5px] text-muted">Seu carrinho está vazio.</p>
              <Link href="/catalogo" onClick={fecharDrawer}>
                <Button size="sm">Ver catálogo</Button>
              </Link>
            </div>
          ) : (
            <>
              {itensIndisponiveis.length > 0 && (
                <p className="mb-4 rounded-atlas-sm bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-600">
                  {itensIndisponiveis.map((item) => item.nome ?? 'Um item').join(', ')} não está
                  mais disponível.
                </p>
              )}
              <div className="flex flex-col">
                {itens.map((item) => (
                  <div
                    key={item.produtoId}
                    className="flex items-center justify-between gap-2.5 border-b border-dashed border-line py-3.5 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-navy">{item.nome}</p>
                      <p className="font-mono text-[11.5px] text-muted">
                        {formatarMoeda(item.precoUnitario)}
                      </p>
                      {!item.disponivel && (
                        <p className="text-[11px] text-red-600">
                          Só {item.estoqueDisponivel} em estoque.
                        </p>
                      )}
                    </div>
                    <Stepper
                      quantidade={item.quantidade}
                      onChange={(q) => atualizarQuantidade(item.produtoId, q)}
                    />
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
            </>
          )}
        </div>

        {itens.length > 0 && (
          <div className="border-t-2 border-dashed border-line p-5">
            <div className="mb-3.5 flex flex-wrap gap-x-3 gap-y-1">
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
            <div className="mb-3.5 flex items-center justify-between font-mono text-[15px] font-semibold text-navy">
              <span>Subtotal</span>
              <span>{formatarMoeda(total)}</span>
            </div>
            <Button
              className="w-full justify-center"
              disabled={temItemIndisponivel}
              onClick={irParaCheckout}
            >
              Continuar para o checkout
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted">
              Frete calculado no checkout, de acordo com a entrega escolhida.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
