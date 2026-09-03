'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { atualizarMeuPerfil, meuPerfil, trocarSenha } from '@/lib/conta';
import { obterSessaoCliente, salvarSessaoCliente } from '@/lib/conta-auth';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function DadosCadastraisPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const perfilQuery = useQuery({ queryKey: ['conta', 'perfil'], queryFn: meuPerfil });

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    if (!perfilQuery.data) return;
    // Sincronizando com o resultado da query (sistema externo, mesma exceção já
    // usada pra localStorage em cart-context.tsx) — não deriva de outro
    // estado/prop local.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNome(perfilQuery.data.nome);
    setEmail(perfilQuery.data.email ?? '');
    setTelefone(perfilQuery.data.telefone ?? '');
  }, [perfilQuery.data]);

  const salvarPerfil = useMutation({
    mutationFn: () =>
      atualizarMeuPerfil({ nome, email: email || undefined, telefone: telefone || undefined }),
    onSuccess: (cliente) => {
      queryClient.setQueryData(['conta', 'perfil'], cliente);
      // O header (ContaLink) e o "Olá, {nome}" do layout leem o nome/e-mail
      // salvos na sessão local — sem atualizar aqui, ficariam desatualizados
      // até o próximo login.
      const sessaoAtual = obterSessaoCliente();
      if (sessaoAtual) {
        salvarSessaoCliente({
          ...sessaoAtual,
          cliente: { ...sessaoAtual.cliente, nome: cliente.nome, email: cliente.email },
        });
      }
      showToast('Dados atualizados.', 'success');
    },
    onError: (erro) => {
      showToast(erro instanceof ApiError ? erro.message : 'Não foi possível salvar.', 'error');
    },
  });

  function aoSalvarPerfil(evento: FormEvent) {
    evento.preventDefault();
    salvarPerfil.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="mb-4 font-display text-base font-bold text-navy">Dados cadastrais</h2>
        {perfilQuery.isLoading ? (
          <p className="text-[13px] text-muted">Carregando…</p>
        ) : (
          <form onSubmit={aoSalvarPerfil} className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Telefone"
              placeholder="(22) 99999-8888"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
            <Button type="submit" disabled={salvarPerfil.isPending} className="self-start">
              {salvarPerfil.isPending ? 'Salvando…' : 'Salvar dados'}
            </Button>
          </form>
        )}
      </Card>

      <TrocarSenhaCard />
    </div>
  );
}

function TrocarSenhaCard() {
  const { showToast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const trocar = useMutation({
    mutationFn: () => trocarSenha(senhaAtual, novaSenha),
    onSuccess: () => {
      setSenhaAtual('');
      setNovaSenha('');
      showToast('Senha alterada.', 'success');
    },
    onError: (erro) => {
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível trocar a senha.',
        'error',
      );
    },
  });

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    trocar.mutate();
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 font-display text-base font-bold text-navy">Trocar senha</h2>
      <p className="mb-4 text-[12.5px] text-muted">
        Trocar a senha desconecta suas outras sessões (outros dispositivos/abas).
      </p>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <Input
          label="Senha atual"
          type="password"
          required
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
        <Input
          label="Nova senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <Button type="submit" disabled={trocar.isPending} className="self-start">
          {trocar.isPending ? 'Salvando…' : 'Trocar senha'}
        </Button>
      </form>
    </Card>
  );
}
