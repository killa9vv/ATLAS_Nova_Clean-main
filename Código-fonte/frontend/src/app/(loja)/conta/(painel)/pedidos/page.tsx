'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  listarMeusPedidos,
  STATUS_PEDIDO_LABEL,
  type Pedido,
  type StatusPedido,
} from '@/lib/conta';
import { useRepetirPedido } from '@/hooks/use-repetir-pedido';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

const BADGE_POR_STATUS: Record<StatusPedido, BadgeVariant> = {
  CRIADO: 'sky',
  AGUARDANDO_PAGAMENTO: 'sky',
  AGUARDANDO_CONTATO: 'amber',
  PAGO: 'green',
  SEPARACAO: 'sky',
  ENVIADO: 'amber',
  ENTREGUE: 'green',
  CANCELADO: 'navy',
  ESTORNADO: 'navy',
};

const TOTAL_ETAPAS = 5;
// Quantas etapas já foram cumpridas. Cancelado e estornado saem da linha do tempo.
const ETAPAS_CUMPRIDAS: Partial<Record<StatusPedido, number>> = {
  CRIADO: 1,
  AGUARDANDO_PAGAMENTO: 1,
  AGUARDANDO_CONTATO: 1,
  PAGO: 2,
  SEPARACAO: 3,
  ENVIADO: 4,
  ENTREGUE: 5,
};

const NOMES_NO_RESUMO = 2;
const LIMITE_POR_PAGINA = 10;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function resumoDosItens(pedido: Pedido): string {
  const nomes = pedido.itens
    .slice(0, NOMES_NO_RESUMO)
    .map((item) => `${item.quantidade}x ${item.nome}`)
    .join(', ');
  const restantes = pedido.itens.length - NOMES_NO_RESUMO;
  return restantes > 0 ? `${nomes} e mais ${restantes}` : nomes;
}

function CartaoPedido({ pedido, indice }: { pedido: Pedido; indice: number }) {
  const repetir = useRepetirPedido();
  const cumpridas = ETAPAS_CUMPRIDAS[pedido.status];
  const hrefDetalhe = `/conta/pedidos/${pedido.id}`;

  return (
    <Card
      className="animate-card-in relative flex flex-col gap-3 p-4 transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-atlas-lg motion-reduce:animate-none motion-reduce:transition-none"
      style={{ animationDelay: `${Math.min(indice, 6) * 50}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0">
          {/* O link cobre o card inteiro; "Comprar de novo" fica por cima dele (z-10), porque
              um botão dentro de um link não é HTML válido. */}
          <Link
            href={hrefDetalhe}
            className="font-mono text-[12px] text-muted after:absolute after:inset-0 after:rounded-atlas"
          >
            Pedido {pedido.numero} — {formatarData(pedido.createdAt)}
          </Link>
          <p className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-navy">
            {resumoDosItens(pedido)}
          </p>
        </div>
        <Badge variant={BADGE_POR_STATUS[pedido.status]}>
          {STATUS_PEDIDO_LABEL[pedido.status]}
        </Badge>
      </div>

      {cumpridas !== undefined && (
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: TOTAL_ETAPAS }, (_, etapa) => (
            <span
              key={etapa}
              className={`h-1 flex-1 rounded-full ${etapa < cumpridas ? 'bg-[#14753c]' : 'bg-line'}`}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[15px] font-bold text-navy">
          {formatarMoeda(pedido.total)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => repetir.mutate(pedido.id)}
          disabled={repetir.isPending}
          aria-label={`Comprar de novo o pedido ${pedido.numero}`}
          className="relative z-10 min-h-9"
        >
          {repetir.isPending ? 'Adicionando…' : 'Comprar de novo'}
        </Button>
      </div>
    </Card>
  );
}

export default function MeusPedidosPage() {
  const [pagina, setPagina] = useState(1);
  const pedidosQuery = useQuery({
    queryKey: ['conta', 'pedidos', pagina],
    queryFn: () => listarMeusPedidos({ pagina, limite: LIMITE_POR_PAGINA }),
  });

  const pedidos = pedidosQuery.data?.itens ?? [];
  const total = pedidosQuery.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA));

  return (
    <div>
      <h2 className="mb-4 font-display text-base font-bold text-navy">Meus pedidos</h2>

      {pedidosQuery.isLoading && (
        <div className="flex flex-col gap-3" aria-label="Carregando pedidos">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {!pedidosQuery.isLoading && pedidos.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-display text-base font-bold text-navy">
            Você ainda não fez nenhum pedido
          </p>
          <p className="text-[13px] text-muted">Quando fizer, ele aparece aqui para acompanhar.</p>
          <Link
            href="/catalogo"
            className="inline-flex items-center rounded-atlas-sm bg-navy px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-2"
          >
            Ver catálogo
          </Link>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {pedidos.map((pedido, indice) => (
          <CartaoPedido key={pedido.id} pedido={pedido} indice={indice} />
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-[13px]">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-muted">
            Página {pagina} de {totalPaginas}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
