'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { buscarEnderecoPorCep } from '@/lib/clientes';
import {
  atualizarEndereco,
  criarEndereco,
  definirEnderecoPadrao,
  excluirEndereco,
  listarMeusEnderecos,
  type DadosEndereco,
  type Endereco,
} from '@/lib/conta';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

const ENDERECO_VAZIO: DadosEndereco = {
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export default function EnderecosPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const enderecosQuery = useQuery({
    queryKey: ['conta', 'enderecos'],
    queryFn: listarMeusEnderecos,
  });
  const [emEdicao, setEmEdicao] = useState<Endereco | null | undefined>(null);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['conta', 'enderecos'] });
  }

  const excluir = useMutation({
    mutationFn: (id: string) => excluirEndereco(id),
    onSuccess: () => {
      invalidar();
      showToast('Endereço excluído.', 'success');
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Não foi possível excluir.', 'error');
    },
  });

  const tornarPadrao = useMutation({
    mutationFn: (id: string) => definirEnderecoPadrao(id),
    onSuccess: () => {
      invalidar();
      showToast('Endereço definido como padrão.', 'success');
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Não foi possível atualizar.', 'error');
    },
  });

  const enderecos = enderecosQuery.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-navy">Meus endereços</h2>
        <Button size="sm" onClick={() => setEmEdicao(undefined)}>
          + Novo endereço
        </Button>
      </div>

      {enderecosQuery.isLoading && <p className="text-[13px] text-muted">Carregando…</p>}

      {!enderecosQuery.isLoading && enderecos.length === 0 && (
        <Card className="p-6 text-center text-[13px] text-muted">
          Você ainda não tem endereços salvos.
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {enderecos.map((endereco) => (
          <Card key={endereco.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              {endereco.padrao && (
                <span className="mb-1.5 inline-block rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Padrão
                </span>
              )}
              <p className="text-[13.5px] text-ink">
                {endereco.logradouro}, {endereco.numero}
                {endereco.complemento ? ` — ${endereco.complemento}` : ''}
              </p>
              <p className="text-[13px] text-muted">
                {endereco.bairro}, {endereco.cidade}/{endereco.estado} — CEP {endereco.cep}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5 text-right text-[12.5px] font-semibold">
              <button
                type="button"
                onClick={() => setEmEdicao(endereco)}
                className="text-blue hover:underline"
              >
                Editar
              </button>
              {!endereco.padrao && (
                <button
                  type="button"
                  onClick={() => tornarPadrao.mutate(endereco.id)}
                  className="text-blue hover:underline"
                >
                  Tornar padrão
                </button>
              )}
              <button
                type="button"
                onClick={() => excluir.mutate(endereco.id)}
                className="text-red-600 hover:underline"
              >
                Excluir
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={emEdicao !== null}
        onClose={() => setEmEdicao(null)}
        title={emEdicao ? 'Editar endereço' : 'Novo endereço'}
      >
        {emEdicao !== null && (
          <EnderecoForm
            key={emEdicao?.id ?? 'novo'}
            endereco={emEdicao}
            onSalvo={() => {
              setEmEdicao(null);
              invalidar();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function EnderecoForm({
  endereco,
  onSalvo,
}: {
  endereco: Endereco | undefined;
  onSalvo: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState<DadosEndereco>(endereco ?? ENDERECO_VAZIO);
  const [erroCep, setErroCep] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: () => (endereco ? atualizarEndereco(endereco.id, form) : criarEndereco(form)),
    onSuccess: () => {
      showToast('Endereço salvo.', 'success');
      onSalvo();
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Não foi possível salvar.', 'error');
    },
  });

  async function aoSairDoCep() {
    setErroCep(null);
    const cepLimpo = somenteDigitos(form.cep);
    if (cepLimpo.length !== 8) return;
    try {
      const dados = await buscarEnderecoPorCep(cepLimpo);
      setForm((prev) => ({
        ...prev,
        logradouro: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
      }));
    } catch (erro) {
      setErroCep(
        erro instanceof ApiError
          ? `${erro.message} Preencha o endereço manualmente.`
          : 'Não conseguimos buscar esse CEP. Preencha o endereço manualmente.',
      );
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    salvar.mutate();
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3.5">
      <Input
        label="CEP"
        required
        value={form.cep}
        onChange={(e) => setForm({ ...form, cep: e.target.value })}
        onBlur={aoSairDoCep}
        error={erroCep ?? undefined}
      />
      <Input
        label="Logradouro"
        required
        value={form.logradouro}
        onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Número"
          required
          value={form.numero}
          onChange={(e) => setForm({ ...form, numero: e.target.value })}
        />
        <Input
          label="Complemento"
          value={form.complemento}
          onChange={(e) => setForm({ ...form, complemento: e.target.value })}
        />
      </div>
      <Input
        label="Bairro"
        required
        value={form.bairro}
        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Cidade"
          required
          value={form.cidade}
          onChange={(e) => setForm({ ...form, cidade: e.target.value })}
        />
        <Input
          label="Estado (UF)"
          required
          maxLength={2}
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
        />
      </div>
      <Button type="submit" disabled={salvar.isPending} className="mt-1">
        {salvar.isPending ? 'Salvando…' : 'Salvar endereço'}
      </Button>
    </form>
  );
}
