'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/http';
import { redefinirSenha } from '@/lib/conta';
import { Button } from '@/components/ui/Button';
import { InputSenha } from '@/components/ui/InputSenha';
import { ContaAviso, ContaErro, ContaMoldura } from '@/components/loja/conta/ContaMoldura';

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
    <ContaMoldura
      titulo="Ativar conta"
      descricao={
        token && !ativada ? 'E-mail confirmado. Escolha uma senha pra sua conta.' : undefined
      }
    >
      {!token ? (
        <p className="mt-4 rounded-atlas-sm bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
          Link inválido — peça um novo em &quot;Criar conta&quot;.
        </p>
      ) : ativada ? (
        <div className="flex flex-col gap-3">
          <ContaAviso>
            Conta ativada! Agora é só entrar com seu e-mail e a senha que você escolheu.
          </ContaAviso>
          <Link href="/conta/entrar">
            <Button className="w-full py-3">Entrar</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <InputSenha
              label="Senha"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <p
              className={`text-[12px] ${senha.length >= 8 ? 'font-semibold text-[#14753c]' : 'text-muted'}`}
            >
              {senha.length >= 8 ? '✓ ' : ''}Pelo menos 8 caracteres
            </p>
          </div>
          <InputSenha
            label="Confirme a senha"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
          {erro && <ContaErro>{erro}</ContaErro>}
          <Button type="submit" disabled={carregando} className="mt-1 py-3">
            {carregando ? 'Ativando…' : 'Ativar conta'}
          </Button>
        </form>
      )}
    </ContaMoldura>
  );
}
