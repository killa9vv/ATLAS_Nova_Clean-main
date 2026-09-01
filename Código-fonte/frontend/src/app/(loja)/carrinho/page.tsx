'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import { useCart } from '@/lib/cart-context';
import { calcularCarrinho, chaveCarrinho } from '@/lib/carrinho';

const TRUST_BADGES = [
  { icone: '⚡', texto: 'Resposta rápida' },
  { icone: '💳', texto: 'Pix, cartão ou combinado' },
  { icone: '🔒', texto: 'Sem pagamento adiantado' },
];

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CarrinhoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { itens, hidratado, atualizarQuantidade, remover, limpar } = useCart();

  const carrinhoQuery = useQuery({
    queryKey: ['carrinho-calculo', chaveCarrinho(itens)],
    queryFn: () => calcularCarrinho(itens),
    enabled: itens.length > 0,
  });

  // Produto some do catálogo (inativado/excluído) depois de já estar no carrinho local
  // — o backend não devolve mais esse produtoId. Remove silenciosamente e avisa.
  useEffect(() => {
    if (!carrinhoQuery.data) return;
    const idsRetornados = new Set(carrinhoQuery.data.itens.map((item) => item.produtoId));
    const removidos = itens.filter((item) => !idsRetornados.has(item.produtoId));
    if (removidos.length > 0) {
      removidos.forEach((item) => remover(item.produtoId));
      showToast(
        `${removidos.map((i) => i.nome).join(', ')} não está mais disponível e foi removido do carrinho.`,
        'error',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrinhoQuery.data]);

  const estoqueInsuficiente =
    carrinhoQuery.error instanceof ApiError && carrinhoQuery.error.status === 409;

  // Espera hidratar antes de decidir "vazio" — logo após montar o carrinho começa
  // vazio até terminar de ler o localStorage (ver CartProvider), senão um reload
  // desta página com carrinho não vazio mostraria "carrinho vazio" por um instante.
  if (!hidratado) {
    return null;
  }

  if (itens.length === 0) {
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
    <main className="mx-auto max-w-xl px-5 py-10">
      {/* Visual de recibo — mesmo padrão do drawer do site antigo: cabeçalho e rodapé
          com borda tracejada, linhas de item separadas por borda tracejada, preços em
          fonte mono. Continua sendo uma página cheia (não um drawer), só a "pele". */}
      <div className="overflow-hidden rounded-atlas border border-line bg-white shadow-atlas">
        <div className="flex items-center justify-between border-b-2 border-dashed border-line px-5 py-4">
          <h1 className="font-display text-lg font-bold text-navy">Sua lista de compras</h1>
          <span className="rounded-full bg-sky px-2.5 py-1 text-[11px] font-bold text-navy">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {estoqueInsuficiente && (
          <p className="mx-5 mt-4 rounded-atlas-sm bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {(carrinhoQuery.error as ApiError).message} Ajuste as quantidades abaixo pra continuar.
          </p>
        )}

        <div className="flex flex-col px-5">
          {itens.map((item) => {
            const calculado = carrinhoQuery.data?.itens.find((i) => i.produtoId === item.produtoId);
            return (
              <div
                key={item.produtoId}
                className="flex items-center justify-between gap-3 border-b border-dashed border-line py-4 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-navy">{item.nome}</p>
                  <p className="font-mono text-[12px] text-muted">
                    {carrinhoQuery.isLoading
                      ? 'Calculando…'
                      : calculado
                        ? formatarMoeda(calculado.precoUnitario)
                        : '—'}
                  </p>
                </div>
                <Stepper
                  quantidade={item.quantidade}
                  onChange={(q) => atualizarQuantidade(item.produtoId, q)}
                />
                <span className="w-20 shrink-0 text-right font-mono text-[13.5px] font-bold text-navy">
                  {calculado ? formatarMoeda(calculado.subtotal) : '—'}
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
            );
          })}
        </div>

        <div className="border-t-2 border-dashed border-line px-5 py-4">
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge.texto}
                className="flex items-center gap-1.5 text-[11.5px] text-muted"
              >
                <span aria-hidden="true">{badge.icone}</span>
                {badge.texto}
              </span>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={limpar}
              className="text-[13px] font-semibold text-muted hover:text-red-600"
            >
              Limpar carrinho
            </button>
            <span className="font-display text-lg font-bold text-navy">
              Total: {carrinhoQuery.data ? formatarMoeda(carrinhoQuery.data.total) : '—'}
            </span>
          </div>

          <Button
            className="w-full"
            disabled={!carrinhoQuery.data || estoqueInsuficiente}
            onClick={() => router.push('/checkout')}
          >
            Continuar para o checkout
          </Button>
          <p className="mt-2 text-center text-[11.5px] text-muted">
            Frete calculado no checkout, de acordo com a entrega escolhida.
          </p>
        </div>
      </div>
    </main>
  );
}
