'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import { atualizarCupomAdmin, listarCuponsAdmin, type CupomAdmin } from '@/lib/admin-cupons';
import {
  atualizarBannerAdmin,
  excluirBannerAdmin,
  listarBannersAdmin,
  type BannerAdmin,
} from '@/lib/admin-banners';
import { CupomFormModal } from './CupomFormModal';
import { BannerFormModal } from './BannerFormModal';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function SecaoCupons() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cupomEmEdicao, setCupomEmEdicao] = useState<CupomAdmin | null | undefined>(null);

  const cuponsQuery = useQuery({
    queryKey: ['admin', 'cupons'],
    queryFn: listarCuponsAdmin,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      atualizarCupomAdmin(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cupons'] });
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao alterar status.', 'error');
    },
  });

  const cupons = cuponsQuery.data ?? [];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-navy">Cupons</h2>
        <Button size="sm" onClick={() => setCupomEmEdicao(undefined)}>
          + Novo cupom
        </Button>
      </div>

      <div className="overflow-x-auto rounded-atlas border border-line bg-white shadow-atlas">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-sky text-left text-[11px] uppercase tracking-wide text-navy">
              <th className="px-3.5 py-2.5">Código</th>
              <th className="px-3.5 py-2.5">Desconto</th>
              <th className="px-3.5 py-2.5">Usos</th>
              <th className="px-3.5 py-2.5">Válido até</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cuponsQuery.isLoading && (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!cuponsQuery.isLoading && cupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3.5 py-6 text-center text-muted">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            )}
            {cupons.map((cupom) => (
              <tr key={cupom.id} className="border-t border-line">
                <td className="px-3.5 py-2.5 font-mono font-semibold text-ink">{cupom.codigo}</td>
                <td className="px-3.5 py-2.5">
                  {cupom.tipoDesconto === 'PERCENTUAL'
                    ? `${cupom.valor}%`
                    : formatarMoeda(cupom.valor)}
                </td>
                <td className="px-3.5 py-2.5 text-muted">
                  {cupom.usosCount}
                  {cupom.usoMaximo ? ` / ${cupom.usoMaximo}` : ''}
                </td>
                <td className="px-3.5 py-2.5 text-muted">
                  {cupom.validoAte ? formatarData(cupom.validoAte) : '—'}
                </td>
                <td className="px-3.5 py-2.5">
                  <Badge variant={cupom.ativo ? 'green' : 'sky'}>
                    {cupom.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCupomEmEdicao(cupom)}
                      className="rounded-atlas-sm bg-sky px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-blue/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: cupom.id, ativo: !cupom.ativo })}
                      className="rounded-atlas-sm bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      {cupom.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CupomFormModal
        cupom={cupomEmEdicao}
        aberto={cupomEmEdicao !== null}
        onClose={() => setCupomEmEdicao(null)}
      />
    </section>
  );
}

function SecaoBanners() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [bannerEmEdicao, setBannerEmEdicao] = useState<BannerAdmin | null | undefined>(null);

  const bannersQuery = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: listarBannersAdmin,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      atualizarBannerAdmin(id, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao alterar status.', 'error');
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => excluirBannerAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      showToast('Banner excluído.', 'success');
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao excluir banner.', 'error');
    },
  });

  const banners = bannersQuery.data ?? [];

  function confirmarExclusao(banner: BannerAdmin) {
    if (window.confirm(`Excluir o banner "${banner.titulo}"? Essa ação não pode ser desfeita.`)) {
      excluirMutation.mutate(banner.id);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-navy">Banners</h2>
        <Button size="sm" onClick={() => setBannerEmEdicao(undefined)}>
          + Novo banner
        </Button>
      </div>

      <div className="overflow-x-auto rounded-atlas border border-line bg-white shadow-atlas">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-sky text-left text-[11px] uppercase tracking-wide text-navy">
              <th className="px-3.5 py-2.5">Título</th>
              <th className="px-3.5 py-2.5">Imagem</th>
              <th className="px-3.5 py-2.5">Ordem</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5">Ações</th>
            </tr>
          </thead>
          <tbody>
            {bannersQuery.isLoading && (
              <tr>
                <td colSpan={5} className="px-3.5 py-6 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            )}
            {!bannersQuery.isLoading && banners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3.5 py-6 text-center text-muted">
                  Nenhum banner cadastrado.
                </td>
              </tr>
            )}
            {banners.map((banner) => (
              <tr key={banner.id} className="border-t border-line">
                <td className="px-3.5 py-2.5 font-medium text-ink">{banner.titulo}</td>
                <td className="px-3.5 py-2.5 text-muted">
                  {banner.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.imagemUrl}
                      alt={banner.titulo}
                      className="h-10 w-16 rounded-atlas-sm object-cover"
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3.5 py-2.5 text-muted">{banner.ordem}</td>
                <td className="px-3.5 py-2.5">
                  <Badge variant={banner.ativo ? 'green' : 'sky'}>
                    {banner.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBannerEmEdicao(banner)}
                      className="rounded-atlas-sm bg-sky px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-blue/20"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: banner.id, ativo: !banner.ativo })}
                      className="rounded-atlas-sm bg-sky px-2.5 py-1.5 text-[12px] font-semibold text-navy hover:bg-blue/20 disabled:opacity-50"
                    >
                      {banner.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      type="button"
                      disabled={excluirMutation.isPending}
                      onClick={() => confirmarExclusao(banner)}
                      className="rounded-atlas-sm bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BannerFormModal
        banner={bannerEmEdicao}
        aberto={bannerEmEdicao !== null}
        onClose={() => setBannerEmEdicao(null)}
      />
    </section>
  );
}

export default function CuponsAdminPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold text-navy">Cupons & banners</h1>
      <SecaoCupons />
      <SecaoBanners />
    </div>
  );
}
