'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { confirmarTrocaEmail } from '@/lib/conta';
import { limparSessaoCliente } from '@/lib/conta-auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmarEmailConteudo />
    </Suspense>
  );
}

// Destino do link do e-mail "Confirme seu novo e-mail". Pede um clique em vez de confirmar
// ao abrir: antivírus e leitores de e-mail costumam visitar os links sozinhos, e isso não
// pode valer como confirmação.
function ConfirmarEmailConteudo() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  async function confirmar() {
    setErro(null);
    setCarregando(true);
    try {
      await confirmarTrocaEmail(token);
      // A troca derruba as sessões no backend; a daqui também não vale mais.
      limparSessaoCliente();
      setConfirmado(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível confirmar. Tente novamente.');
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
        <h1 className="font-display text-xl font-bold text-navy">Confirmar novo e-mail</h1>

        {!token ? (
          <p className="mt-4 rounded-atlas-sm bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
            Link inválido. Peça a troca de e-mail de novo na sua conta.
          </p>
        ) : confirmado ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="rounded-atlas-sm bg-sky px-3 py-2.5 text-[13px] text-navy">
              E-mail alterado! Entre de novo usando o endereço novo.
            </p>
            <Link href="/conta/entrar">
              <Button className="w-full">Entrar</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <p className="text-[13px] text-muted">
              Clique abaixo pra passar a usar este endereço na sua conta. Você precisará entrar de
              novo.
            </p>
            {erro && (
              <p
                role="alert"
                className="rounded-atlas-sm bg-red-50 px-3 py-2 text-[13px] text-red-600"
              >
                {erro}
              </p>
            )}
            <Button type="button" disabled={carregando} onClick={() => void confirmar()}>
              {carregando ? 'Confirmando…' : 'Confirmar e-mail'}
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
