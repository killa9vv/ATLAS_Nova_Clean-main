'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { loginCliente } from '@/lib/conta';
import { salvarSessaoCliente } from '@/lib/conta-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const sessao = await loginCliente(email, senha);
      salvarSessaoCliente(sessao);
      router.push('/conta');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.');
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
        <h1 className="font-display text-xl font-bold text-navy">Entrar na sua conta</h1>
        <p className="mt-1 text-[13px] text-muted">
          Acompanhe seus pedidos, endereços salvos e dados cadastrais.
        </p>

        <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            required
            autoComplete="current-password"
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
            {carregando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-1.5 text-center text-[13px]">
          <Link href="/conta/esqueci-senha" className="font-semibold text-blue hover:underline">
            Esqueci minha senha
          </Link>
          <p className="text-muted">
            Ainda não tem conta?{' '}
            <Link href="/conta/criar-conta" className="font-semibold text-blue hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
