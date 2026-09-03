'use client';

import { KeyboardEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import {
  atualizarRastreioPedidoAdmin,
  atualizarStatusPedidoAdmin,
  listarPedidosAdmin,
  STATUS_BADGE_CLASSES,
  STATUS_LABEL,
  TRANSICOES_PERMITIDAS,
  type PedidoAdmin,
  type StatusPedido,
} from '@/lib/admin-pedidos';

const LIMITE_PAGINA = 20;
const TODOS_STATUS = Object.keys(STATUS_LABEL) as StatusPedido[];

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function imprimirPedido(pedido: PedidoAdmin) {
  const janela = window.open('', '_blank', 'width=420,height=600');
  if (!janela) return;

  const linhasItens = pedido.itens
    .map(
      (item) =>
        `<tr><td>${item.quantidade}x ${item.nome}</td><td style="text-align:right">${formatarMoeda(item.precoUnitario * item.quantidade)}</td></tr>`,
    )
    .join('');

  const entrega =
    pedido.tipoEntrega === 'RETIRADA'
      ? '<p><b>Retirada na loja</b></p>'
      : `<p><b>Entrega:</b> ${pedido.endereco?.logradouro}, ${pedido.endereco?.numero}${pedido.endereco?.complemento ? ' — ' + pedido.endereco.complemento : ''}<br>${pedido.endereco?.bairro} — ${pedido.endereco?.cidade}/${pedido.endereco?.estado}<br>CEP ${pedido.endereco?.cep}</p>`;

  janela.document.write(`<!doctype html><html><head><title>Pedido ${pedido.numero}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:16px;font-size:13px;color:#0a0e1a}
      h2{margin:0 0 4px}
      table{width:100%;border-collapse:collapse;margin:10px 0}
      td{padding:3px 0}
      .total{font-weight:bold;border-top:1px solid #ccc;padding-top:6px}
    </style></head>
    <body>
      <h2>Atlas Nova Clean</h2>
      <p>Pedido <b>${pedido.numero}</b><br>Status: ${STATUS_LABEL[pedido.status]}<br>${new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
      <table>${linhasItens}
        <tr class="total"><td>Frete</td><td style="text-align:right">${formatarMoeda(pedido.valorFrete)}</td></tr>
        <tr class="total"><td>Total</td><td style="text-align:right">${formatarMoeda(pedido.total)}</td></tr>
      </table>
      ${entrega}
      ${pedido.codigoRastreio ? `<p><b>Rastreio:</b> ${pedido.codigoRastreio}</p>` : ''}
    </body></html>`);
  janela.document.close();
  janela.focus();
  janela.print();
}

function LinhaPedido({ pedido }: { pedido: PedidoAdmin }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [rastreio, setRastreio] = useState(pedido.codigoRastreio ?? '');

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'pedidos'] });
  }

  const statusMutation = useMutation({
    mutationFn: (status: StatusPedido) => atualizarStatusPedidoAdmin(pedido.id, status),
    onSuccess: () => {
      invalidar();
      showToast('Status atualizado.', 'success');
    },
    onError: (erro) =>
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao mudar status.', 'error'),
  });

  const rastreioMutation = useMutation({
    mutationFn: (codigo: string) => atualizarRastreioPedidoAdmin(pedido.id, codigo),
    onSuccess: () => {
      invalidar();
      showToast('Rastreio salvo.', 'success');
    },
    onError: (erro) => {
      setRastreio(pedido.codigoRastreio ?? '');
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao salvar rastreio.', 'error');
    },
  });

  function salvarRastreioSeMudou() {
    if (rastreio !== (pedido.codigoRastreio ?? '')) rastreioMutation.mutate(rastreio);
  }

  function aoTeclarRastreio(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') evento.currentTarget.blur();
  }

  const proximosStatus = TRANSICOES_PERMITIDAS[pedido.status];

  return (
    <tr className="border-t border-line align-top">
      <td className="px-3.5 py-2.5 font-mono text-[12px] text-muted">{pedido.numero}</td>
      <td className="px-3.5 py-2.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase ${STATUS_BADGE_CLASSES[pedido.status]}`}
        >
          {STATUS_LABEL[pedido.status]}
        </span>
      </td>
      <td className="px-3.5 py-2.5">{formatarMoeda(pedido.total)}</td>
      <td className="px-3.5 py-2.5 text-muted">
        {pedido.tipoEntrega === 'RETIRADA' ? 'Retirada' : 'Entrega'}
      </td>
      <td className="px-3.5 py-2.5">
        <input
          type="text"
          placeholder="código"
          value={rastreio}
          disabled={rastreioMutation.isPending}
          onChange={(e) => setRastreio(e.target.value)}
          onBlur={salvarRastreioSeMudou}
          onKeyDown={aoTeclarRastreio}
          className="w-32 rounded-atlas-sm border border-line bg-white px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-blue/40"
        />
      </td>
      <td className="px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {proximosStatus.length > 0 && (
            <select
              disabled={statusMutation.isPending}
              value=""
              onChange={(e) => {
                if (e.target.value) statusMutation.mutate(e.target.value as StatusPedido);
              }}
              className="rounded-atlas-sm border border-line bg-white px-2 py-1.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue/40"
            >
              <option value="">Mudar status…</option>
              {proximosStatus.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => imprimirPedido(pedido)}
            className="rounded-atlas-sm bg-sky px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-blue/20"
          >
            Imprimir
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function PedidosAdminPage() {
  const [pagina, setPagina] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido | ''>('');

  const pedidosQuery = useQuery({
    queryKey: ['admin', 'pedidos', pagina, statusFiltro],
    queryFn: () =>
      listarPedidosAdmin({
        pagina,
        limite: LIMITE_PAGINA,
        status: statusFiltro || undefined,
      }),
  });

  const pedidos = pedidosQuery.data?.itens ?? [];
  const total = pedidosQuery.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_PAGINA));

  function aoMudarFiltro(novoStatus: StatusPedido | '') {
    setStatusFiltro(novoStatus);
    setPagina(1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-navy">Pedidos</h1>
        <select
          value={statusFiltro}
          onChange={(e) => aoMudarFiltro(e.target.value as StatusPedido | '')}
          className="rounded-atlas-sm border border-line bg-white px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-blue/40"
        >
          <option value="">Todos os status</option>
          {TODOS_STATUS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-atlas border border-line bg-white shadow-atlas">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-sky text-left text-[11px] uppercase tracking-wide text-navy">
              <th className="px-3.5 py-2.5">Número</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Total</th>
              <th className="px-3.5 py-2.5">Entrega</th>
              <th className="px-3.5 py-2.5">Rastreio</th>
              <th className="px-3.5 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidosQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!pedidosQuery.isLoading && pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-muted">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
            {pedidos.map((pedido) => (
              <LinhaPedido key={pedido.id} pedido={pedido} />
            ))}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-[12.5px] text-muted">
          <span>
            Página {pagina} de {totalPaginas} — {total} pedido{total === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => p - 1)}
              className="rounded-atlas-sm border border-line bg-white px-3 py-1.5 font-semibold text-navy disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
              className="rounded-atlas-sm border border-line bg-white px-3 py-1.5 font-semibold text-navy disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
