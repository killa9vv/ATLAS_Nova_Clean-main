'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { redefinirSenha } from '@/lib/conta';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function AtivarContaPage() {
  return (
    <Suspense fallback={null}>
      <AtivarContaConteudo />
    </Suspense>
  );
}

// Destino do link do e-mail "Ative sua conta". Usa o mesmo endpoint da recuperação
// de senha (POST /auth/clientes/redefinir-senha) — o token de ativação sai da mesma
// tabela; definir a senha com ele é o que confirma que a pessoa é dona do e-mail.
function AtivarContaConteudo() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ativada, setAtivada] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }
    setCarregando(true);

    try {
      await redefinirSenha(token, senha);
      setAtivada(true);
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? `${e.message} Peça um novo link em "Criar conta".`
          : 'Não foi possível ativar sua conta. Tente novamente.',
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
        <h1 className="font-display text-xl font-bold text-navy">Ativar conta</h1>

        {!token ? (
          <p className="mt-4 rounded-atlas-sm bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
            Link inválido — peça um novo em &quot;Criar conta&quot;.
          </p>
        ) : ativada ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="rounded-atlas-sm bg-sky px-3 py-2.5 text-[13px] text-navy">
              Conta ativada! Agora é só entrar com seu e-mail e a senha que você escolheu.
            </p>
            <Link href="/conta/entrar">
              <Button className="w-full">Entrar</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-[13px] text-muted">
              E-mail confirmado. Escolha uma senha pra sua conta.
            </p>
            <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
              <Input
                label="Senha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <Input
                label="Confirme a senha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
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
                {carregando ? 'Ativando…' : 'Ativar conta'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
