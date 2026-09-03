'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { loginCliente, registrarCliente } from '@/lib/conta';
import { salvarSessaoCliente } from '@/lib/conta-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function CriarContaPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      // Registrar reaproveita o upsert-por-e-mail de CriarClienteUseCase no
      // backend — se esse e-mail já tiver comprado como convidado antes, essa
      // chamada só adiciona a senha na conta existente, não duplica nada.
      await registrarCliente({ nome, email, senha, telefone: telefone || undefined });
      const sessao = await loginCliente(email, senha);
      salvarSessaoCliente(sessao);
      router.push('/conta');
    } catch (e) {
      setErro(
        e instanceof ApiError ? e.message : 'Não foi possível criar sua conta. Tente novamente.',
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-5 py-10">
      <Card className="w-full p-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue">
          Atlas Nova Clean
        </p>
        <h1 className="font-display text-xl font-bold text-navy">Criar conta</h1>
        <p className="mt-1 text-[13px] text-muted">
          Salve seus endereços e acompanhe seus pedidos.
        </p>

        <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
          <Input
            label="Nome completo"
            required
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Telefone"
            placeholder="(22) 99999-8888"
            autoComplete="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro && (
            <p
              role="alert"
              className="rounded-atlas-sm bg-red-50 px-3 py-2 text-[13px] text-red-600"
            >
              {erro}
            </p>
          )}
          <Button type="submit" disabled={carregando} className="mt-1">
            {carregando ? 'Criando conta…' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-muted">
          Já tem conta?{' '}
          <Link href="/conta/entrar" className="font-semibold text-blue hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </main>
  );
}
