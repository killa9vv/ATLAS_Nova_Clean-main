'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listarMeusPedidos, STATUS_PEDIDO_LABEL, type StatusPedido } from '@/lib/conta';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const BADGE_POR_STATUS: Record<StatusPedido, BadgeVariant> = {
  CRIADO: 'sky',
  AGUARDANDO_PAGAMENTO: 'sky',
  AGUARDANDO_CONTATO: 'amber',
  PAGO: 'green',
  CANCELADO: 'navy',
  ESTORNADO: 'navy',
};

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

      {pedidosQuery.isLoading && <p className="text-[13px] text-muted">Carregando…</p>}

      {!pedidosQuery.isLoading && pedidos.length === 0 && (
        <Card className="p-6 text-center text-[13px] text-muted">
          Você ainda não fez nenhum pedido.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {pedidos.map((pedido) => (
          <Link key={pedido.id} href={`/conta/pedidos/${pedido.id}`}>
            <Card className="flex items-center justify-between gap-4 p-4 transition-transform hover:-translate-y-0.5">
              <div>
                <p className="font-mono text-[12px] text-muted">
                  Pedido #{pedido.id.slice(0, 8)} — {formatarData(pedido.createdAt)}
                </p>
                <p className="mt-1 text-[13.5px] text-ink">
                  {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'} —{' '}
                  <span className="font-mono font-semibold">{formatarMoeda(pedido.total)}</span>
                </p>
              </div>
              <Badge variant={BADGE_POR_STATUS[pedido.status]}>
                {STATUS_PEDIDO_LABEL[pedido.status]}
              </Badge>
            </Card>
          </Link>
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
