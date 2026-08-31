'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import {
  alternarStatusProdutoAdmin,
  listarProdutosAdmin,
  type ProdutoAdmin,
} from '@/lib/admin-produtos';
import { ProdutoFormModal } from './ProdutoFormModal';
import { ImagensModal } from './ImagensModal';

const LIMITE_POR_PAGINA = 20;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProdutosAdminPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<ProdutoAdmin | null | undefined>(null);
  const [produtoParaImagens, setProdutoParaImagens] = useState<ProdutoAdmin | null>(null);

  const produtosQuery = useQuery({
    queryKey: ['admin', 'produtos', { pagina, busca }],
    queryFn: () =>
      listarProdutosAdmin({ pagina, limite: LIMITE_POR_PAGINA, busca: busca || undefined }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ativar }: { id: string; ativar: boolean }) =>
      alternarStatusProdutoAdmin(id, ativar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'produtos'] });
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao alterar status.', 'error');
    },
  });

  const produtos = produtosQuery.data?.itens ?? [];
  const totalPaginas = produtosQuery.data?.totalPaginas ?? 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-navy">Produtos</h1>
        <Button onClick={() => setProdutoEmEdicao(undefined)}>+ Novo produto</Button>
      </div>

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Buscar por nome…"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-atlas border border-line bg-white shadow-atlas">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-sky text-left text-[11px] uppercase tracking-wide text-navy">
              <th className="px-3.5 py-2.5">Nome</th>
              <th className="px-3.5 py-2.5">Categoria</th>
              <th className="px-3.5 py-2.5">Preço</th>
              <th className="px-3.5 py-2.5">Estoque</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!produtosQuery.isLoading && produtos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-muted">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-t border-line">
                <td className="px-3.5 py-2.5 font-medium text-ink">{produto.nome}</td>
                <td className="px-3.5 py-2.5 text-muted">{produto.categoria || '—'}</td>
                <td className="px-3.5 py-2.5">{formatarMoeda(produto.preco)}</td>
                <td className="px-3.5 py-2.5">{produto.estoque}</td>
                <td className="px-3.5 py-2.5">
                  <Badge variant={produto.ativo ? 'green' : 'sky'}>
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setProdutoEmEdicao(produto)}
                      className="rounded-atlas-sm bg-sky px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-blue/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setProdutoParaImagens(produto)}
                      className="rounded-atlas-sm bg-sky px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-blue/20"
                    >
                      Imagens
                    </button>
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({ id: produto.id, ativar: !produto.ativo })
                      }
                      className="rounded-atlas-sm bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {produto.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-[13px]">
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

      <ProdutoFormModal
        produto={produtoEmEdicao}
        aberto={produtoEmEdicao !== null}
        onClose={() => setProdutoEmEdicao(null)}
      />
      <ImagensModal produto={produtoParaImagens} onClose={() => setProdutoParaImagens(null)} />
    </div>
  );
}
