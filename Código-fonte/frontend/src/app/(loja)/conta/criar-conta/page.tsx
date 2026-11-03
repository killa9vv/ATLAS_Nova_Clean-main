'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/http';
import { registrarCliente } from '@/lib/conta';
import { formatarTelefone, telefoneValido } from '@/lib/formatos';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ContaAviso, ContaErro, ContaMoldura } from '@/components/loja/conta/ContaMoldura';

export default function CriarContaPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefoneTocado, setTelefoneTocado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativasFalhas, setTentativasFalhas] = useState(0);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!telefoneValido(telefone)) {
      setTelefoneTocado(true);
      return;
    }
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
      setTentativasFalhas((atual) => atual + 1);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ContaMoldura titulo="Criar conta" descricao="Salve seus endereços e acompanhe seus pedidos.">
      {enviadoPara ? (
        <ContaAviso>
          Enviamos um link pra <span className="font-semibold">{enviadoPara}</span>. Abra o e-mail e
          clique em <span className="font-semibold">Ativar conta</span> pra escolher sua senha. O
          link vale por 24 horas — confira também a caixa de spam.
        </ContaAviso>
      ) : (
        <form onSubmit={aoEnviar} className="mt-6 flex flex-col gap-4">
          <Input
            label="Nome completo"
            required
            autoFocus
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Telefone (opcional)"
            type="tel"
            placeholder="(22) 99999-8888"
            autoComplete="tel-national"
            inputMode="tel"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            onBlur={() => setTelefoneTocado(true)}
            error={
              telefoneTocado && !telefoneValido(telefone)
                ? 'Informe o DDD e o número completo.'
                : undefined
            }
          />
          <p className="text-[12px] text-muted">
            Você escolhe a senha depois, pelo link que enviamos ao seu e-mail.
          </p>
          {erro && <ContaErro tentativa={tentativasFalhas}>{erro}</ContaErro>}
          <Button type="submit" disabled={carregando} className="mt-1 py-3">
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
    </ContaMoldura>
  );
}
