'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/http';
import { esqueciSenha } from '@/lib/conta';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // A resposta é sempre a mesma, exista a conta ou não (pra não revelar quais
  // e-mails estão cadastrados) — o link de redefinição só chega por e-mail.
  const [enviado, setEnviado] = useState(false);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      await esqueciSenha(email);
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível enviar. Tente novamente.');
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
        <h1 className="font-display text-xl font-bold text-navy">Recuperar senha</h1>
        <p className="mt-1 text-[13px] text-muted">
          Informe o e-mail da sua conta pra receber as instruções.
        </p>

        {enviado ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="rounded-atlas-sm bg-sky px-3 py-2.5 text-[13px] text-navy">
              Se o e-mail informado estiver cadastrado, enviaremos instruções de recuperação.
              Confira também a caixa de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {carregando ? 'Enviando…' : 'Enviar instruções'}
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
