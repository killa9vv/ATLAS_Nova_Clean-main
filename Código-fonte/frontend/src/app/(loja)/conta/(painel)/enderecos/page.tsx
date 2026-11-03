'use client';

import { FormEvent, useRef, useState } from 'react';
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
import { formatarCep, somenteDigitos } from '@/lib/formatos';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';

const ENDERECO_VAZIO: DadosEndereco = {
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

export default function EnderecosPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const enderecosQuery = useQuery({
    queryKey: ['conta', 'enderecos'],
    queryFn: listarMeusEnderecos,
  });
  const [emEdicao, setEmEdicao] = useState<Endereco | null | undefined>(null);
  // Excluir não tem desfazer: o primeiro clique só pergunta.
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['conta', 'enderecos'] });
  }

  const excluir = useMutation({
    mutationFn: (id: string) => excluirEndereco(id),
    onSuccess: () => {
      invalidar();
      setConfirmandoExclusaoId(null);
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-navy">Meus endereços</h2>
        {enderecos.length > 0 && (
          <Button size="sm" onClick={() => setEmEdicao(undefined)}>
            + Novo endereço
          </Button>
        )}
      </div>

      {enderecosQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Carregando endereços">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      )}

      {!enderecosQuery.isLoading && enderecos.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-display text-base font-bold text-navy">Nenhum endereço salvo ainda</p>
          <p className="max-w-sm text-[13px] text-muted">
            Salve um endereço e ele já vem preenchido quando você finalizar a compra.
          </p>
          <Button onClick={() => setEmEdicao(undefined)}>+ Adicionar endereço</Button>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {enderecos.map((endereco, indice) => {
          const confirmando = confirmandoExclusaoId === endereco.id;
          return (
            <Card
              key={endereco.id}
              className={`animate-card-in flex flex-col justify-between gap-3 p-4 motion-reduce:animate-none ${
                endereco.padrao ? 'border-navy ring-1 ring-navy' : ''
              }`}
              style={{ animationDelay: `${indice * 70}ms` }}
            >
              <div className="min-w-0">
                {endereco.padrao && (
                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    <span aria-hidden="true">★</span> Padrão
                  </span>
                )}
                <p className="break-words text-[14px] font-semibold text-navy">
                  {endereco.logradouro}, {endereco.numero}
                  {endereco.complemento ? ` — ${endereco.complemento}` : ''}
                </p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {endereco.bairro}, {endereco.cidade}/{endereco.estado}
                </p>
                <p className="font-mono text-[12px] text-muted">CEP {formatarCep(endereco.cep)}</p>
              </div>

              {confirmando ? (
                <div
                  className="bolha-chega flex flex-wrap items-center justify-between gap-2 rounded-atlas-sm bg-red-50 px-3 py-2"
                  role="group"
                  aria-label="Confirmar exclusão"
                >
                  <span className="text-[13px] font-semibold text-red-700">
                    Excluir este endereço?
                  </span>
                  <span className="flex gap-3 text-[13px] font-bold">
                    <button
                      type="button"
                      onClick={() => setConfirmandoExclusaoId(null)}
                      disabled={excluir.isPending}
                      className="py-1 text-navy hover:underline"
                    >
                      Manter
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir.mutate(endereco.id)}
                      disabled={excluir.isPending}
                      className="py-1 text-red-700 hover:underline disabled:opacity-60"
                    >
                      {excluir.isPending ? 'Excluindo…' : 'Sim, excluir'}
                    </button>
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2.5 text-[13px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setEmEdicao(endereco)}
                    aria-label={`Editar ${endereco.logradouro}, ${endereco.numero}`}
                    className="py-1 text-blue hover:underline"
                  >
                    Editar
                  </button>
                  {!endereco.padrao && (
                    <button
                      type="button"
                      onClick={() => tornarPadrao.mutate(endereco.id)}
                      disabled={tornarPadrao.isPending}
                      className="py-1 text-blue hover:underline disabled:opacity-60"
                    >
                      Tornar padrão
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmandoExclusaoId(endereco.id)}
                    aria-label={`Excluir ${endereco.logradouro}, ${endereco.numero}`}
                    className="ml-auto py-1 text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </Card>
          );
        })}
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
  const [buscandoCep, setBuscandoCep] = useState(false);
  const numeroRef = useRef<HTMLInputElement>(null);
  // Começa com o CEP salvo: abrir pra editar não pode apagar o que já está no endereço.
  const ultimoCepBuscadoRef = useRef(somenteDigitos(endereco?.cep ?? ''));

  const salvar = useMutation({
    // Sempre só dígitos, como os endereços já salvos: a máscara é só pra leitura na tela.
    mutationFn: () => {
      const dados = { ...form, cep: somenteDigitos(form.cep) };
      return endereco ? atualizarEndereco(endereco.id, dados) : criarEndereco(dados);
    },
    onSuccess: () => {
      showToast('Endereço salvo.', 'success');
      onSalvo();
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Não foi possível salvar.', 'error');
    },
  });

  // Mesmo comportamento do checkout: busca ao completar os 8 dígitos e só quando o CEP muda.
  async function aoMudarCep(valor: string) {
    const cep = formatarCep(valor);
    const digitos = somenteDigitos(cep);
    setForm((prev) => ({ ...prev, cep }));
    setErroCep(null);
    if (digitos.length !== 8 || digitos === ultimoCepBuscadoRef.current) return;

    ultimoCepBuscadoRef.current = digitos;
    setBuscandoCep(true);
    try {
      const dados = await buscarEnderecoPorCep(digitos);
      if (ultimoCepBuscadoRef.current !== digitos) return;
      setForm((prev) => ({
        ...prev,
        logradouro: dados.logradouro,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
      }));
      numeroRef.current?.focus();
    } catch (erro) {
      setErroCep(
        erro instanceof ApiError
          ? `${erro.message} Preencha o endereço manualmente.`
          : 'Não conseguimos buscar esse CEP. Preencha o endereço manualmente.',
      );
    } finally {
      setBuscandoCep(false);
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    salvar.mutate();
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <Input
          label="CEP"
          required
          autoComplete="postal-code"
          inputMode="numeric"
          placeholder="00000-000"
          value={formatarCep(form.cep)}
          onChange={(e) => void aoMudarCep(e.target.value)}
          error={erroCep ?? undefined}
        />
        {buscandoCep && (
          <p className="text-[12px] text-muted" role="status">
            Buscando endereço…
          </p>
        )}
      </div>
      <Input
        label="Rua"
        required
        autoComplete="address-line1"
        value={form.logradouro}
        onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          ref={numeroRef}
          label="Número"
          required
          inputMode="numeric"
          value={form.numero}
          onChange={(e) => setForm({ ...form, numero: e.target.value })}
        />
        <Input
          label="Complemento (opcional)"
          autoComplete="address-line2"
          value={form.complemento}
          onChange={(e) => setForm({ ...form, complemento: e.target.value })}
        />
      </div>
      <Input
        label="Bairro"
        required
        autoComplete="address-level3"
        value={form.bairro}
        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
      />
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <Input
          label="Cidade"
          required
          autoComplete="address-level2"
          value={form.cidade}
          onChange={(e) => setForm({ ...form, cidade: e.target.value })}
        />
        <Input
          label="UF"
          required
          autoComplete="address-level1"
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
