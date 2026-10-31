'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/http';
import { registrarCliente } from '@/lib/conta';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function CriarContaPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      // Não define senha aqui: o backend manda um link de ativação pro e-mail e a
      // senha é escolhida em /conta/ativar-conta — só quem acessa o e-mail ativa a
      // conta (inclusive quando o e-mail já tinha comprado como convidado).
      await registrarCliente({ nome, email, telefone: telefone || undefined });
      setEnviadoPara(email);
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

        {enviadoPara ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="rounded-atlas-sm bg-sky px-3 py-2.5 text-[13px] text-navy">
              Enviamos um link pra <span className="font-semibold">{enviadoPara}</span>. Abra o
              e-mail e clique em <span className="font-semibold">Ativar conta</span> pra escolher
              sua senha. O link vale por 24 horas — confira também a caixa de spam.
            </p>
          </div>
        ) : (
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
              autoComplete="email"
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
            {erro && (
              <p
                role="alert"
                className="rounded-atlas-sm bg-red-50 px-3 py-2 text-[13px] text-red-600"
              >
                {erro}
              </p>
            )}
            <Button type="submit" disabled={carregando} className="mt-1">
              {carregando ? 'Enviando…' : 'Criar conta'}
            </Button>
          </form>
        )}

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
