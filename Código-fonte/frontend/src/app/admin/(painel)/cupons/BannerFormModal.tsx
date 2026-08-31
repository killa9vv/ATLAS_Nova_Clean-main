'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import {
  atualizarBannerAdmin,
  criarBannerAdmin,
  type BannerAdmin,
  type DadosBannerForm,
} from '@/lib/admin-banners';

export interface BannerFormModalProps {
  /** null = fechado. undefined = aberto em modo criação. BannerAdmin = aberto editando esse banner. */
  banner: BannerAdmin | null | undefined;
  aberto: boolean;
  onClose: () => void;
}

function formInicial(banner: BannerAdmin | null | undefined): DadosBannerForm {
  return banner
    ? {
        titulo: banner.titulo,
        imagemUrl: banner.imagemUrl ?? '',
        linkUrl: banner.linkUrl ?? '',
        ordem: banner.ordem,
      }
    : { titulo: '', imagemUrl: '', linkUrl: '', ordem: 0 };
}

export function BannerFormModal({ banner, aberto, onClose }: BannerFormModalProps) {
  const editando = !!banner;

  return (
    <Modal open={aberto} onClose={onClose} title={editando ? 'Editar banner' : 'Novo banner'}>
      {/* key força remontar o form (estado fresco) ao trocar de banner/criação —
          evita useEffect+setState só pra sincronizar com a prop `banner`. */}
      {aberto && <BannerForm key={banner?.id ?? 'novo'} banner={banner} onSalvo={onClose} />}
    </Modal>
  );
}

function BannerForm({
  banner,
  onSalvo,
}: {
  banner: BannerAdmin | null | undefined;
  onSalvo: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const editando = !!banner;
  const [form, setForm] = useState<DadosBannerForm>(() => formInicial(banner));

  const mutation = useMutation({
    mutationFn: () => {
      const dados = {
        titulo: form.titulo,
        imagemUrl: form.imagemUrl || undefined,
        linkUrl: form.linkUrl || undefined,
        ordem: form.ordem,
      };
      return editando ? atualizarBannerAdmin(banner!.id, dados) : criarBannerAdmin(dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      showToast(editando ? 'Banner atualizado.' : 'Banner criado.', 'success');
      onSalvo();
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao salvar banner.', 'error');
    },
  });

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3.5">
      <Input
        label="Título"
        required
        maxLength={120}
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
      />
      <Input
        label="URL da imagem"
        type="url"
        placeholder="https://…"
        value={form.imagemUrl}
        onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })}
      />
      <Input
        label="Link de destino"
        type="url"
        placeholder="https://…"
        value={form.linkUrl}
        onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
      />
      <Input
        label="Ordem de exibição"
        type="number"
        min={0}
        value={form.ordem}
        onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
      />

      <Button type="submit" disabled={mutation.isPending} className="mt-1">
        {mutation.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
      </Button>
    </form>
  );
}
