'use client';

import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { atualizarMeuPerfil, meuPerfil, solicitarTrocaEmail, trocarSenha } from '@/lib/conta';
import { obterSessaoCliente, salvarSessaoCliente } from '@/lib/conta-auth';
import { formatarTelefone, telefoneValido } from '@/lib/formatos';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InputSenha } from '@/components/ui/InputSenha';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

const TAMANHO_MINIMO_SENHA = 8;

export default function DadosCadastraisPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const perfilQuery = useQuery({ queryKey: ['conta', 'perfil'], queryFn: meuPerfil });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    if (!perfilQuery.data) return;
    // Sincronizando com o resultado da query (sistema externo, mesma exceção já
    // usada pra localStorage em cart-context.tsx) — não deriva de outro
    // estado/prop local.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNome(perfilQuery.data.nome);
    setTelefone(formatarTelefone(perfilQuery.data.telefone ?? ''));
  }, [perfilQuery.data]);

  const salvarPerfil = useMutation({
    mutationFn: () => atualizarMeuPerfil({ nome, telefone: telefone || undefined }),
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

  // Compara dígitos no telefone: o salvo pode não ter a máscara que aparece no campo.
  const houveMudanca =
    !!perfilQuery.data &&
    (nome !== perfilQuery.data.nome ||
      telefone !== formatarTelefone(perfilQuery.data.telefone ?? ''));
  const dadosValidos = nome.trim().length > 0 && telefoneValido(telefone);

  function aoSalvarPerfil(evento: FormEvent) {
    evento.preventDefault();
    if (houveMudanca && dadosValidos) salvarPerfil.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="mb-4 font-display text-base font-bold text-navy">Dados cadastrais</h2>
        {perfilQuery.isLoading ? (
          <div className="flex flex-col gap-4" aria-label="Carregando dados">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        ) : (
          <form onSubmit={aoSalvarPerfil} className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              required
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <Input label="E-mail" type="email" disabled value={perfilQuery.data?.email ?? ''} />
              <p className="text-[12px] text-muted">
                Para mudar, use &quot;Trocar e-mail&quot; abaixo.
              </p>
            </div>
            <Input
              label="Telefone"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              placeholder="(22) 99999-8888"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              error={
                telefone && !telefoneValido(telefone)
                  ? 'Informe o DDD e o número completo.'
                  : undefined
              }
            />
            <Button
              type="submit"
              disabled={!houveMudanca || !dadosValidos || salvarPerfil.isPending}
              className="self-start"
            >
              {salvarPerfil.isPending
                ? 'Salvando…'
                : houveMudanca
                  ? 'Salvar alterações'
                  : 'Tudo salvo'}
            </Button>
          </form>
        )}
      </Card>

      <section aria-labelledby="titulo-seguranca">
        <h2 id="titulo-seguranca" className="mb-2.5 font-display text-base font-bold text-navy">
          Segurança
        </h2>
        <div className="flex flex-col gap-3">
          <TrocarEmailCard />
          <TrocarSenhaCard />
        </div>
      </section>
    </div>
  );
}

// Recolhido: trocar e-mail ou senha é raro, e aberto ocupava a maior parte da tela.
function BlocoRecolhivel({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-atlas border border-line bg-white shadow-atlas">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 hover:bg-paper [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-navy">{titulo}</span>
          <span className="block text-[12.5px] text-muted">{descricao}</span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-line p-4">{children}</div>
    </details>
  );
}

function TrocarEmailCard() {
  const { showToast } = useToast();
  const [novoEmail, setNovoEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const solicitar = useMutation({
    mutationFn: () => solicitarTrocaEmail(novoEmail, senhaAtual),
    onSuccess: ({ mensagem }) => {
      setNovoEmail('');
      setSenhaAtual('');
      setAviso(mensagem);
    },
    onError: (erro) => {
      setAviso(null);
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível pedir a troca de e-mail.',
        'error',
      );
    },
  });

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    solicitar.mutate();
  }

  return (
    <BlocoRecolhivel
      titulo="Trocar e-mail"
      descricao="A troca só vale depois de confirmar pelo link enviado ao e-mail novo."
    >
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <p className="text-[12.5px] text-muted">
          Depois de clicar no link, será preciso entrar de novo.
        </p>
        <Input
          label="Novo e-mail"
          type="email"
          required
          autoComplete="email"
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
        />
        <InputSenha
          label="Senha atual"
          required
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
        {aviso && (
          <p role="status" className="rounded-atlas-sm bg-sky px-3 py-2.5 text-[13px] text-navy">
            {aviso}
          </p>
        )}
        <Button type="submit" disabled={solicitar.isPending} className="self-start">
          {solicitar.isPending ? 'Enviando…' : 'Enviar link de confirmação'}
        </Button>
      </form>
    </BlocoRecolhivel>
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

  const senhaLongaOBastante = novaSenha.length >= TAMANHO_MINIMO_SENHA;

  return (
    <BlocoRecolhivel
      titulo="Trocar senha"
      descricao="Trocar a senha desconecta suas outras sessões (outros dispositivos/abas)."
    >
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        <InputSenha
          label="Senha atual"
          required
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <InputSenha
            label="Nova senha"
            required
            minLength={TAMANHO_MINIMO_SENHA}
            autoComplete="new-password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <p
            className={`text-[12px] ${senhaLongaOBastante ? 'font-semibold text-[#14753c]' : 'text-muted'}`}
          >
            {senhaLongaOBastante ? '✓ ' : ''}Pelo menos {TAMANHO_MINIMO_SENHA} caracteres
          </p>
        </div>
        <Button type="submit" disabled={trocar.isPending} className="self-start">
          {trocar.isPending ? 'Salvando…' : 'Trocar senha'}
        </Button>
      </form>
    </BlocoRecolhivel>
  );
}
