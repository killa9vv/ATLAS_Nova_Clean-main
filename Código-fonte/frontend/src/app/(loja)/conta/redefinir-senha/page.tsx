'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { redefinirSenha } from '@/lib/conta';
import { Button } from '@/components/ui/Button';
import { InputSenha } from '@/components/ui/InputSenha';
import { ContaErro, ContaMoldura } from '@/components/loja/conta/ContaMoldura';

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
    <ContaMoldura titulo="Redefinir senha">
      {!token ? (
        <p className="mt-4 rounded-atlas-sm bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
          Link inválido — solicite a recuperação de senha novamente.
        </p>
      ) : (
        <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <InputSenha
              label="Nova senha"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
            <p
              className={`text-[12px] ${novaSenha.length >= 8 ? 'font-semibold text-[#14753c]' : 'text-muted'}`}
            >
              {novaSenha.length >= 8 ? '✓ ' : ''}Pelo menos 8 caracteres
            </p>
          </div>
          {erro && <ContaErro>{erro}</ContaErro>}
          <Button type="submit" disabled={carregando} className="mt-1 py-3">
            {carregando ? 'Salvando…' : 'Redefinir senha'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-[13px] text-muted">
        <Link href="/conta/entrar" className="font-semibold text-blue hover:underline">
          Voltar pro login
        </Link>
      </p>
    </ContaMoldura>
  );
}
