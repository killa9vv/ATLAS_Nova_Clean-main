'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import {
  atualizarCupomAdmin,
  criarCupomAdmin,
  type CupomAdmin,
  type TipoDescontoCupom,
} from '@/lib/admin-cupons';

export interface CupomFormModalProps {
  /** null = fechado. undefined = aberto em modo criação. CupomAdmin = aberto editando esse cupom. */
  cupom: CupomAdmin | null | undefined;
  aberto: boolean;
  onClose: () => void;
}

interface FormCupom {
  codigo: string;
  tipoDesconto: TipoDescontoCupom;
  valor: number;
  validoAte: string;
  usoMaximo: string;
}

function formInicial(cupom: CupomAdmin | null | undefined): FormCupom {
  return cupom
    ? {
        codigo: cupom.codigo,
        tipoDesconto: cupom.tipoDesconto,
        valor: cupom.valor,
        validoAte: cupom.validoAte ? cupom.validoAte.slice(0, 10) : '',
        usoMaximo: cupom.usoMaximo ? String(cupom.usoMaximo) : '',
      }
    : { codigo: '', tipoDesconto: 'PERCENTUAL', valor: 0, validoAte: '', usoMaximo: '' };
}

export function CupomFormModal({ cupom, aberto, onClose }: CupomFormModalProps) {
  const editando = !!cupom;

  return (
    <Modal open={aberto} onClose={onClose} title={editando ? 'Editar cupom' : 'Novo cupom'}>
      {/* key força remontar o form (estado fresco) ao trocar de cupom/criação —
          evita useEffect+setState só pra sincronizar com a prop `cupom`. */}
      {aberto && <CupomForm key={cupom?.id ?? 'novo'} cupom={cupom} onSalvo={onClose} />}
    </Modal>
  );
}

function CupomForm({
  cupom,
  onSalvo,
}: {
  cupom: CupomAdmin | null | undefined;
  onSalvo: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const editando = !!cupom;
  const [form, setForm] = useState<FormCupom>(() => formInicial(cupom));

  const mutation = useMutation({
    mutationFn: () => {
      const validoAte = form.validoAte
        ? new Date(`${form.validoAte}T23:59:59.000Z`).toISOString()
        : undefined;
      const usoMaximo = form.usoMaximo ? Number(form.usoMaximo) : undefined;

      if (editando) {
        return atualizarCupomAdmin(cupom!.id, {
          tipoDesconto: form.tipoDesconto,
          valor: form.valor,
          validoAte,
          usoMaximo,
        });
      }
      return criarCupomAdmin({
        codigo: form.codigo,
        tipoDesconto: form.tipoDesconto,
        valor: form.valor,
        validoAte,
        usoMaximo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cupons'] });
      showToast(editando ? 'Cupom atualizado.' : 'Cupom criado.', 'success');
      onSalvo();
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao salvar cupom.', 'error');
    },
  });

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3.5">
      <Input
        label="Código"
        required
        disabled={editando}
        maxLength={30}
        placeholder="BEMVINDO10"
        value={form.codigo}
        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
      />
      {editando && (
        <p className="-mt-2 text-xs text-muted">
          O código não pode ser alterado depois de criado. Pra trocar, crie um cupom novo e desative
          este.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-navy">Tipo de desconto</span>
          <select
            value={form.tipoDesconto}
            onChange={(e) =>
              setForm({ ...form, tipoDesconto: e.target.value as TipoDescontoCupom })
            }
            className="rounded-atlas-sm border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-blue/40"
          >
            <option value="PERCENTUAL">Percentual (%)</option>
            <option value="VALOR_FIXO">Valor fixo (R$)</option>
          </select>
        </label>
        <Input
          label={form.tipoDesconto === 'PERCENTUAL' ? 'Valor (%)' : 'Valor (R$)'}
          type="number"
          step="0.01"
          min={0}
          required
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Válido até"
          type="date"
          value={form.validoAte}
          onChange={(e) => setForm({ ...form, validoAte: e.target.value })}
        />
        <Input
          label="Uso máximo"
          type="number"
          min={1}
          placeholder="Ilimitado"
          value={form.usoMaximo}
          onChange={(e) => setForm({ ...form, usoMaximo: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={mutation.isPending} className="mt-1">
        {mutation.isPending ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
      </Button>
    </form>
  );
}
