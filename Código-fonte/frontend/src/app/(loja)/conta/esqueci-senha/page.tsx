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
  // `enviado` separa "ainda não mandou o formulário" de "mandou, mas o backend
  // não devolveu token" (e-mail sem conta, ou sem senha — resposta sempre 200,
  // de propósito, pra não revelar qual dos dois é o motivo). `linkDev` só vem
  // preenchido em modo dev, sem envio de e-mail real ainda (ver TODO em
  // SolicitarRecuperacaoSenhaUseCase) — enquanto isso, o link fica visível aqui.
  const [enviado, setEnviado] = useState(false);
  const [linkDev, setLinkDev] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const resultado = await esqueciSenha(email);
      setLinkDev(
        resultado.token
          ? `/conta/redefinir-senha?token=${encodeURIComponent(resultado.token)}`
          : null,
      );
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
            {linkDev ? (
              <>
                <p className="rounded-atlas-sm bg-sky px-3 py-2.5 text-[13px] text-navy">
                  Sem envio de e-mail configurado ainda (modo de desenvolvimento) — use o link
                  abaixo pra redefinir sua senha.
                </p>
                <Link href={linkDev}>
                  <Button className="w-full">Redefinir senha</Button>
                </Link>
              </>
            ) : (
              <p className="rounded-atlas-sm bg-sky px-3 py-2.5 text-[13px] text-navy">
                Se o e-mail informado estiver cadastrado, enviaremos instruções de recuperação.
              </p>
            )}
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
