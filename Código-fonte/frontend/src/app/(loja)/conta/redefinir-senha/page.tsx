'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { redefinirSenha } from '@/lib/conta';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaConteudo />
    </Suspense>
  );
}

function RedefinirSenhaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [novaSenha, setNovaSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await redefinirSenha(token, novaSenha);
      router.push('/conta/entrar');
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível redefinir sua senha. Solicite um novo link.',
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
        <h1 className="font-display text-xl font-bold text-navy">Redefinir senha</h1>

        {!token ? (
          <p className="mt-4 rounded-atlas-sm bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
            Link inválido — solicite a recuperação de senha novamente.
          </p>
        ) : (
          <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
            <Input
              label="Nova senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
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
              {carregando ? 'Salvando…' : 'Redefinir senha'}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-[13px] text-muted">
          <Link href="/conta/entrar" className="font-semibold text-blue hover:underline">
            Voltar pro login
          </Link>
        </p>
      </Card>
    </main>
  );
}
