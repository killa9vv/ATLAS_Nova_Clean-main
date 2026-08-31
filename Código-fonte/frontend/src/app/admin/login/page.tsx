'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/http';
import { salvarSessaoAdmin, type SessaoAdmin } from '@/lib/admin-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function AdminLoginPage() {
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
      const sessao = await api.post<SessaoAdmin>('/auth/login', { email, senha });

      if (sessao.usuario.papel !== 'ADMIN') {
        setErro('Este acesso é restrito a administradores.');
        return;
      }

      salvarSessaoAdmin(sessao);
      router.push('/admin/dashboard');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-paper via-sky to-paper p-6">
      <Card className="w-full max-w-sm p-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue">
          Atlas Nova Clean
        </p>
        <h1 className="font-display text-xl font-bold text-navy">Painel administrativo</h1>
        <p className="mt-1 text-[13px] text-muted">Acesso restrito a usuários com papel ADMIN.</p>

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
      </Card>
    </main>
  );
}
