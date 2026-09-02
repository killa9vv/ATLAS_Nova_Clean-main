'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { buscarMeuPedido, buscarRastreio, repetirPedido, STATUS_PEDIDO_LABEL } from '@/lib/conta';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { adicionar, abrirDrawer } = useCart();

  const pedidoQuery = useQuery({
    queryKey: ['conta', 'pedido', params.id],
    queryFn: () => buscarMeuPedido(params.id),
  });
  const rastreioQuery = useQuery({
    queryKey: ['conta', 'pedido', params.id, 'rastreio'],
    queryFn: () => buscarRastreio(params.id),
  });

  const repetir = useMutation({
    mutationFn: () => repetirPedido(params.id),
    onSuccess: (resultado) => {
      resultado.itens.forEach((item) => {
        adicionar(item.produtoId, item.nome, item.precoUnitario, item.quantidade);
      });

      if (resultado.itens.length > 0) {
        showToast(
          `${resultado.itens.length} ${resultado.itens.length === 1 ? 'item adicionado' : 'itens adicionados'} ao carrinho.`,
          'success',
        );
      }
      if (resultado.itensIndisponiveis.length > 0) {
        showToast(
          `Não disponível: ${resultado.itensIndisponiveis.map((i) => i.nome).join(', ')}.`,
          'error',
        );
      }
      if (resultado.itens.length > 0) {
        abrirDrawer();
      }
    },
    onError: (erro) => {
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível repetir o pedido.',
        'error',
      );
    },
  });

  if (pedidoQuery.isLoading) {
    return <p className="text-[13px] text-muted">Carregando…</p>;
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

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => router.push('/conta/pedidos')}
        className="inline-flex w-fit items-center gap-2 text-[14px] font-semibold text-navy hover:text-blue"
      >
        ← Voltar
      </button>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[12px] text-muted">Pedido #{pedido.id.slice(0, 8)}</p>
            <h2 className="font-display text-lg font-bold text-navy">
              {STATUS_PEDIDO_LABEL[pedido.status]}
            </h2>
          </div>
          <Button onClick={() => repetir.mutate()} disabled={repetir.isPending} size="sm">
            {repetir.isPending ? 'Repetindo…' : 'Repetir pedido'}
          </Button>
        </div>

        <div className="flex flex-col">
          {pedido.itens.map((item) => (
            <div
              key={item.produtoId}
              className="flex justify-between border-b border-dashed border-line py-2.5 text-[13px] text-ink last:border-b-0"
            >
              <span>
                {item.quantidade}x {item.nome}
              </span>
              <span className="font-mono font-semibold">
                {formatarMoeda(item.precoUnitario * item.quantidade)}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-right font-display text-lg font-bold text-navy">
          Total: <span className="font-mono">{formatarMoeda(pedido.total)}</span>
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="mb-2 font-display text-[14px] font-bold text-navy">Entrega</h3>
        {pedido.tipoEntrega === 'RETIRADA' ? (
          <p className="text-[13px] text-ink">Retirada na loja</p>
        ) : (
          <p className="text-[13px] text-ink">
            {pedido.endereco?.logradouro}, {pedido.endereco?.numero} — {pedido.endereco?.bairro},{' '}
            {pedido.endereco?.cidade}/{pedido.endereco?.estado}
          </p>
        )}
        {pedido.codigoRastreio && (
          <p className="mt-2 text-[13px] text-ink">
            Código de rastreio:{' '}
            <span className="font-mono font-semibold">{pedido.codigoRastreio}</span>
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="mb-3 font-display text-[14px] font-bold text-navy">Acompanhamento</h3>
        {rastreioQuery.isLoading && <p className="text-[13px] text-muted">Carregando…</p>}
        {rastreioQuery.data && (
          <ol className="flex flex-col gap-3">
            {rastreioQuery.data.historico.map((evento, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue" />
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
              <p className="text-[13px] text-muted">Ainda sem histórico de status.</p>
            )}
          </ol>
        )}
      </Card>
    </div>
  );
}
