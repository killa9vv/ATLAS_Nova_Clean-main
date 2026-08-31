'use client';

import { KeyboardEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import { atualizarProdutoAdmin, listarProdutosAdmin } from '@/lib/admin-produtos';

// Estoque é um recorte rápido de Produtos (mesmos dados, mesmo PUT /produtos/:id) —
// só focado em "o que precisa reposição", ordenado por menor estoque primeiro,
// com edição inline em vez de abrir modal. Cadastro/edição completa (nome, preço,
// imagens) continua em /admin/produtos.
const LIMITE = 200;

function ItemEstoque({
  produto,
}: {
  produto: { id: string; nome: string; categoria?: string; estoque: number; ativo: boolean };
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [valor, setValor] = useState(String(produto.estoque));

  const mutation = useMutation({
    mutationFn: (novoEstoque: number) =>
      atualizarProdutoAdmin(produto.id, { estoque: novoEstoque }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'estoque'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'produtos'] });
      showToast('Estoque atualizado.', 'success');
    },
    onError: (erro) => {
      setValor(String(produto.estoque));
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao atualizar estoque.', 'error');
    },
  });

  function salvarSeMudou() {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) {
      setValor(String(produto.estoque));
      return;
    }
    if (numero !== produto.estoque) mutation.mutate(numero);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') evento.currentTarget.blur();
  }

  return (
    <tr className="border-t border-line">
      <td className="px-3.5 py-2.5 font-medium text-ink">{produto.nome}</td>
      <td className="px-3.5 py-2.5 text-muted">{produto.categoria || '—'}</td>
      <td className="px-3.5 py-2.5">
        <Badge variant={produto.ativo ? 'green' : 'sky'}>
          {produto.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </td>
      <td className="px-3.5 py-2.5">
        <input
          type="number"
          min={0}
          value={valor}
          disabled={mutation.isPending}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvarSeMudou}
          onKeyDown={aoTeclar}
          className={[
            'w-24 rounded-atlas-sm border px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue/40',
            produto.estoque <= 0
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-line bg-white text-ink',
          ].join(' ')}
        />
      </td>
    </tr>
  );
}

export default function EstoqueAdminPage() {
  const [busca, setBusca] = useState('');

  const produtosQuery = useQuery({
    queryKey: ['admin', 'estoque', busca],
    queryFn: () => listarProdutosAdmin({ pagina: 1, limite: LIMITE, busca: busca || undefined }),
  });

  const produtosOrdenados = useMemo(
    () => [...(produtosQuery.data?.itens ?? [])].sort((a, b) => a.estoque - b.estoque),
    [produtosQuery.data],
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">Estoque</h1>

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Buscar por nome…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-atlas border border-line bg-white shadow-atlas">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-sky text-left text-[11px] uppercase tracking-wide text-navy">
              <th className="px-3.5 py-2.5">Nome</th>
              <th className="px-3.5 py-2.5">Categoria</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Estoque</th>
            </tr>
          </thead>
          <tbody>
            {produtosQuery.isLoading && (
              <tr>
                <td colSpan={4} className="px-3.5 py-6 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!produtosQuery.isLoading && produtosOrdenados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3.5 py-6 text-center text-muted">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {produtosOrdenados.map((produto) => (
              <ItemEstoque key={produto.id} produto={produto} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
