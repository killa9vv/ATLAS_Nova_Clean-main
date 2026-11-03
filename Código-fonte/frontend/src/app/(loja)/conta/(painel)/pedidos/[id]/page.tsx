'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import {
  buscarMeuPedido,
  buscarRastreio,
  ETAPAS_CUMPRIDAS_POR_STATUS,
  STATUS_PEDIDO_LABEL,
  TOTAL_ETAPAS_PEDIDO,
} from '@/lib/conta';
import { useRepetirPedido } from '@/hooks/use-repetir-pedido';
import { CarrinhoItemImagem } from '@/components/loja/CarrinhoItemImagem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function nomesDasEtapas(ehRetirada: boolean): string[] {
  return [
    'Recebido',
    'Pago',
    'Em separação',
    ehRetirada ? 'Pronto' : 'Enviado',
    ehRetirada ? 'Retirado' : 'Entregue',
  ];
}

function LinhaDoTempo({ cumpridas, nomes }: { cumpridas: number; nomes: string[] }) {
  return (
    <ol
      className="mt-5 grid list-none p-0"
      style={{ gridTemplateColumns: `repeat(${TOTAL_ETAPAS_PEDIDO}, minmax(0, 1fr))` }}
    >
      {nomes.map((nome, etapa) => {
        const feita = etapa < cumpridas;
        return (
          <li
            key={nome}
            aria-current={etapa === cumpridas - 1 ? 'step' : undefined}
            className="relative flex flex-col items-center gap-1.5 text-center"
          >
            {etapa > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-[11px] h-0.5 w-full ${feita ? 'bg-[#14753c]' : 'bg-line'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                feita ? 'estrela-pop bg-[#14753c] text-white' : 'bg-line text-muted'
              }`}
              style={{ animationDelay: `${etapa * 90}ms` }}
            >
              {feita ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                etapa + 1
              )}
            </span>
            <span
              className={`text-[11px] leading-tight ${feita ? 'font-semibold text-navy' : 'text-muted'}`}
            >
              {nome}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const pedidoQuery = useQuery({
    queryKey: ['conta', 'pedido', params.id],
    queryFn: () => buscarMeuPedido(params.id),
  });
  const rastreioQuery = useQuery({
    queryKey: ['conta', 'pedido', params.id, 'rastreio'],
    queryFn: () => buscarRastreio(params.id),
  });

  const repetir = useRepetirPedido();

  if (pedidoQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-label="Carregando pedido">
        <Skeleton className="h-64" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  if (pedidoQuery.isError || !pedidoQuery.data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-[13px] text-muted">
          {pedidoQuery.error instanceof ApiError
            ? pedidoQuery.error.message
            : 'Não foi possível carregar este pedido.'}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/conta/pedidos')}
          className="mt-3"
        >
          Voltar pros meus pedidos
        </Button>
      </Card>
    );
  }

  const pedido = pedidoQuery.data;
  const ehRetirada = pedido.tipoEntrega === 'RETIRADA';
  const cumpridas = ETAPAS_CUMPRIDAS_POR_STATUS[pedido.status];
  const subtotal = pedido.itens.reduce(
    (soma, item) => soma + item.precoUnitario * item.quantidade,
    0,
  );
  // O pedido não traz o desconto nesta rota: é o que falta pra fechar com o total cobrado.
  const descontos = Math.round((subtotal + pedido.valorFrete - pedido.total) * 100) / 100;

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.push('/conta/pedidos')}
        className="group inline-flex w-fit items-center gap-2 text-[14px] font-semibold text-navy hover:text-blue"
      >
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none"
        >
          ←
        </span>
        Voltar
      </button>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[12px] text-muted">
              Pedido {pedido.numero} — {formatarDataHora(pedido.createdAt)}
            </p>
            <h2 className="font-display text-lg font-bold text-navy">
              {STATUS_PEDIDO_LABEL[pedido.status]}
            </h2>
          </div>
          <Button
            onClick={() => repetir.mutate(params.id)}
            disabled={repetir.isPending}
            className="active:scale-[0.98]"
          >
            {repetir.isPending ? 'Adicionando…' : 'Comprar de novo'}
          </Button>
        </div>

        {cumpridas !== undefined ? (
          <LinhaDoTempo cumpridas={cumpridas} nomes={nomesDasEtapas(ehRetirada)} />
        ) : (
          <p className="mt-4 rounded-atlas-sm bg-paper px-3 py-2 text-[13px] text-muted">
            Este pedido não segue mais em andamento.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="mb-3 font-display text-[14px] font-bold text-navy">Itens do pedido</h3>
        <ul className="flex list-none flex-col gap-3 p-0">
          {pedido.itens.map((item) => (
            <li key={item.produtoId} className="flex items-center gap-3 text-[13px]">
              <CarrinhoItemImagem produtoId={item.produtoId} nome={item.nome} tamanho={48} />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-semibold leading-snug text-navy">
                  {item.nome}
                </span>
                <span className="font-mono text-[12px] text-muted">
                  {item.quantidade} × {formatarMoeda(item.precoUnitario)}
                </span>
              </span>
              <span className="font-mono font-semibold text-navy">
                {formatarMoeda(item.precoUnitario * item.quantidade)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="m-0 mt-4 flex flex-col gap-1.5 border-t border-line pt-3.5 text-[13px] text-navy">
          <div className="flex justify-between gap-3">
            <dt>Subtotal</dt>
            <dd className="m-0 font-mono">{formatarMoeda(subtotal)}</dd>
          </div>
          {descontos > 0 && (
            <div className="flex justify-between gap-3 font-semibold text-[#14753c]">
              <dt>Descontos</dt>
              <dd className="m-0 font-mono">−{formatarMoeda(descontos)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt>Frete</dt>
            <dd className="m-0 font-mono">
              {pedido.valorFrete === 0 ? 'Grátis' : formatarMoeda(pedido.valorFrete)}
            </dd>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-line pt-2.5">
            <dt className="font-display text-[15px] font-bold">Total</dt>
            <dd className="m-0 font-mono text-[20px] font-bold">{formatarMoeda(pedido.total)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-2 font-display text-[14px] font-bold text-navy">
            {ehRetirada ? 'Retirada na loja' : 'Entrega'}
          </h3>
          {ehRetirada ? (
            <p className="text-[13px] text-ink">
              Av. Arthur Bernardes, 619 — Campos dos Goytacazes, RJ. Segunda a sábado, das 8h às
              18h, assim que a loja confirmar que o pedido está pronto.
            </p>
          ) : (
            <p className="text-[13px] text-ink">
              {pedido.endereco?.logradouro}, {pedido.endereco?.numero}
              {pedido.endereco?.complemento ? ` (${pedido.endereco.complemento})` : ''} —{' '}
              {pedido.endereco?.bairro}, {pedido.endereco?.cidade}/{pedido.endereco?.estado}
            </p>
          )}
          {pedido.codigoRastreio && (
            <p className="mt-2 text-[13px] text-ink">
              Código de rastreio:{' '}
              <span className="break-all font-mono font-semibold">{pedido.codigoRastreio}</span>
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-3 font-display text-[14px] font-bold text-navy">Histórico</h3>
          {rastreioQuery.isLoading && <Skeleton className="h-16" />}
          {rastreioQuery.data && (
            <ol className="flex list-none flex-col gap-3 p-0">
              {rastreioQuery.data.historico.map((evento, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${i === 0 ? 'bg-[#14753c]' : 'bg-line'}`}
                  />
                  <div>
                    <p className="text-[13px] font-semibold text-navy">
                      {STATUS_PEDIDO_LABEL[evento.statusNovo]}
                    </p>
                    <p className="font-mono text-[11.5px] text-muted">
                      {formatarDataHora(evento.alteradoEm)}
                    </p>
                  </div>
                </li>
              ))}
              {rastreioQuery.data.historico.length === 0 && (
                <li className="text-[13px] text-muted">Ainda sem histórico de status.</li>
              )}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
