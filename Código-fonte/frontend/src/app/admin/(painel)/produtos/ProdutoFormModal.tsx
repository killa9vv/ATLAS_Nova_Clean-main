'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import {
  atualizarProdutoAdmin,
  criarProdutoAdmin,
  type DadosProdutoForm,
  type ProdutoAdmin,
} from '@/lib/admin-produtos';

export interface ProdutoFormModalProps {
  /** null = fechado. undefined = aberto em modo criação. ProdutoAdmin = aberto editando esse produto. */
  produto: ProdutoAdmin | null | undefined;
  aberto: boolean;
  onClose: () => void;
}

function formInicial(produto: ProdutoAdmin | null | undefined): DadosProdutoForm {
  return produto
    ? {
        nome: produto.nome,
        descricao: produto.descricao ?? '',
        categoria: produto.categoria ?? '',
        preco: produto.preco,
        estoque: produto.estoque,
      }
    : { nome: '', descricao: '', categoria: '', preco: 0, estoque: 0 };
}

export function ProdutoFormModal({ produto, aberto, onClose }: ProdutoFormModalProps) {
  const editando = !!produto;

  return (
    <Modal
      open={aberto}
      onClose={onClose}
      title={
        editando
          ? `Editar produto${produto?.marca?.nome ? ` — ${produto.marca.nome}${produto.pack ? ` · ${produto.pack}` : ''}` : ''}`
          : 'Novo produto'
      }
    >
      {/* key força remontar o form (estado fresco) ao trocar de produto/criação —
          evita useEffect+setState só pra sincronizar com a prop `produto`. */}
      {aberto && <ProdutoForm key={produto?.id ?? 'novo'} produto={produto} onSalvo={onClose} />}
    </Modal>
  );
}

function ProdutoForm({
  produto,
  onSalvo,
}: {
  produto: ProdutoAdmin | null | undefined;
  onSalvo: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const editando = !!produto;
  const [form, setForm] = useState<DadosProdutoForm>(() => formInicial(produto));

  const mutation = useMutation({
    mutationFn: () =>
      editando ? atualizarProdutoAdmin(produto!.id, form) : criarProdutoAdmin(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'produtos'] });
      showToast(editando ? 'Produto atualizado.' : 'Produto criado.', 'success');
      onSalvo();
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao salvar produto.', 'error');
    },
  });

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3.5">
      <Input
        label="Nome"
        required
        maxLength={150}
        value={form.nome}
        onChange={(e) => setForm({ ...form, nome: e.target.value })}
      />
      <Input
        label="Categoria"
        placeholder="limpeza, descartaveis, papelaria…"
        value={form.categoria}
        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Preço (R$)"
          type="number"
          step="0.01"
          min={0}
          required
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
        />
        <Input
          label="Estoque"
          type="number"
          min={0}
          value={form.estoque}
          onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) })}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-navy">Descrição</span>
        <textarea
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="min-h-20 rounded-atlas-sm border border-line bg-white px-3.5 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-blue/40"
        />
      </label>
      <Button type="submit" disabled={mutation.isPending} className="mt-1">
        {mutation.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
      </Button>
    </form>
  );
}
