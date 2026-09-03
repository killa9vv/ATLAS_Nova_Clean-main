'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/http';
import { Card } from '@/components/ui/Card';
import {
  listarPedidosAdmin,
  STATUS_BADGE_CLASSES,
  STATUS_LABEL,
  type StatusPedido,
} from '@/lib/admin-pedidos';

interface ProdutoAdmin {
  id: string;
  ativo: boolean;
  estoque: number;
}

interface ProdutoPaginado {
  itens: ProdutoAdmin[];
}

const STATUS_PENDENTES: StatusPedido[] = ['CRIADO', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_CONTATO'];

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  // limite alto pelo mesmo motivo de produtos?limite=500 abaixo: esta tela agrega
  // estatísticas do mês inteiro no client, não uma listagem paginada de verdade
  // (essa fica em /admin/pedidos).
  const pedidosQuery = useQuery({
    queryKey: ['admin', 'pedidos', 'dashboard'],
    queryFn: () => listarPedidosAdmin({ limite: 1000 }),
  });

  // GET /produtos é público (usado pela loja) — não precisa do Authorization
  // header do adminApi, só reaproveitamos a mesma listagem paginada.
  const produtosQuery = useQuery({
    queryKey: ['admin', 'produtos-para-estoque'],
    queryFn: () => api.get<ProdutoPaginado>('/produtos?limite=500'),
  });

  const carregando = pedidosQuery.isLoading || produtosQuery.isLoading;
  const erro = pedidosQuery.error ?? produtosQuery.error;

  const pedidos = pedidosQuery.data?.itens ?? [];
  const produtos = produtosQuery.data?.itens ?? [];

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const pedidosPagosDoMes = pedidos.filter(
    (p) => p.status === 'PAGO' && new Date(p.createdAt) >= inicioMes,
  );
  const vendasDoMes = pedidosPagosDoMes.reduce((soma, p) => soma + p.total, 0);
  const ticketMedio = pedidosPagosDoMes.length ? vendasDoMes / pedidosPagosDoMes.length : 0;
  const pedidosPendentes = pedidos.filter((p) => STATUS_PENDENTES.includes(p.status)).length;
  // Só produtos ativos: um produto desativado sem estoque não é uma ação pendente.
  const semEstoque = produtos.filter((p) => p.ativo && p.estoque <= 0).length;

  const pedidosRecentes = pedidos.slice(0, 8);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">Dashboard</h1>

      {erro && (
        <p className="mb-5 rounded-atlas-sm bg-red-50 px-4 py-3 text-[13px] text-red-600">
          Não foi possível carregar os dados do dashboard agora. Tente recarregar a página.
        </p>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            Vendas do mês
          </p>
          <p className="mt-1 font-display text-2xl text-navy">
            {carregando ? '—' : formatarMoeda(vendasDoMes)}
          </p>
        </Card>
        <Card>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            Ticket médio
          </p>
          <p className="mt-1 font-display text-2xl text-navy">
            {carregando ? '—' : formatarMoeda(ticketMedio)}
          </p>
        </Card>
        <Card>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            Pedidos pendentes
          </p>
          <p className="mt-1 font-display text-2xl text-navy">
            {carregando ? '—' : pedidosPendentes}
          </p>
        </Card>
        <Card>
          <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
            Sem estoque
          </p>
          <p className="mt-1 font-display text-2xl text-navy">{carregando ? '—' : semEstoque}</p>
        </Card>
      </div>

      <h2 className="mb-3 font-display text-[15px] font-semibold text-navy">Pedidos recentes</h2>
      <div className="overflow-x-auto rounded-atlas border border-line bg-white shadow-atlas">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-sky text-left text-[11px] uppercase tracking-wide text-navy">
              <th className="px-3.5 py-2.5">ID</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Total</th>
              <th className="px-3.5 py-2.5">Data</th>
            </tr>
          </thead>
          <tbody>
            {!carregando && pedidosRecentes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3.5 py-6 text-center text-muted">
                  Nenhum pedido ainda.
                </td>
              </tr>
            )}
            {pedidosRecentes.map((pedido) => (
              <tr key={pedido.id} className="border-t border-line">
                <td className="px-3.5 py-2.5 font-mono text-[12px] text-muted">
                  {pedido.id.slice(0, 8)}…
                </td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase ${STATUS_BADGE_CLASSES[pedido.status]}`}
                  >
                    {STATUS_LABEL[pedido.status]}
                  </span>
                </td>
                <td className="px-3.5 py-2.5">{formatarMoeda(pedido.total)}</td>
                <td className="px-3.5 py-2.5 text-muted">
                  {new Date(pedido.createdAt).toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
