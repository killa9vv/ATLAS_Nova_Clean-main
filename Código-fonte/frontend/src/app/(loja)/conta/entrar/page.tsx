'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { loginCliente } from '@/lib/conta';
import { salvarSessaoCliente } from '@/lib/conta-auth';
import { CHAVE_QUERY_CARRINHO, useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InputSenha } from '@/components/ui/InputSenha';
import { ContaErro, ContaMoldura } from '@/components/loja/conta/ContaMoldura';

// Só aceita caminho interno ("/checkout"), nunca URL externa, "//outro-site" nem
// "/\outro-site" (alguns navegadores tratam a barra invertida como "//") — senão o
// link de login viraria um redirecionador pra qualquer site.
function destinoSeguro(voltar: string | null): string {
  return voltar && /^\/(?![/\\])/.test(voltar) ? voltar : '/conta';
}

export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <EntrarConteudo />
    </Suspense>
  );
}

function EntrarConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?voltar=/checkout — vindo do "Já tem conta? Entrar" do checkout, volta pra lá
  // depois de entrar (o carrinho anônimo é adotado pela conta, ver comentário abaixo).
  const destino = destinoSeguro(searchParams.get('voltar'));
  const veioDoCheckout = destino === '/checkout';
  const queryClient = useQueryClient();
  const { quantidadeTotal } = useCart();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Muda a cada falha: a mesma mensagem de erro duas vezes também precisa chamar a atenção.
  const [tentativasFalhas, setTentativasFalhas] = useState(0);

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const sessao = await loginCliente(email, senha);
      salvarSessaoCliente(sessao);
      // O backend funde/adota o carrinho anônimo automaticamente na próxima
      // requisição que carregar os dois headers juntos (X-Cart-Session +
      // Authorization — ver ResolverCarrinhoSessaoUseCase) — sem invalidar aqui, o
      // header continuaria mostrando o carrinho anônimo antigo até alguma outra
      // ação disparar um refetch por conta própria.
      await queryClient.invalidateQueries({ queryKey: CHAVE_QUERY_CARRINHO });
      router.push(destino);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível entrar. Tente novamente.');
      setTentativasFalhas((atual) => atual + 1);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ContaMoldura
      titulo="Entrar na sua conta"
      descricao="Acompanhe seus pedidos, endereços salvos e dados cadastrais."
    >
      {veioDoCheckout && quantidadeTotal > 0 && (
        <p className="mt-4 rounded-atlas-sm bg-sky px-3 py-2 text-[13px] font-semibold text-navy">
          {quantidadeTotal === 1
            ? 'Seu item continua no carrinho.'
            : `Seus ${quantidadeTotal} itens continuam no carrinho.`}
        </p>
      )}

      <form onSubmit={aoEnviar} className="mt-5 flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          required
          autoFocus
          autoComplete="username"
          inputMode="email"
          enterKeyHint="next"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputSenha
          label="Senha"
          required
          autoComplete="current-password"
          enterKeyHint="go"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        {erro && <ContaErro tentativa={tentativasFalhas}>{erro}</ContaErro>}
        <Button
          type="submit"
          disabled={carregando}
          className="mt-1 py-3 transition-[background-color,scale] active:scale-[0.98] motion-reduce:transition-none"
        >
          {carregando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-5 flex flex-col gap-1.5 text-center text-[13px]">
        <Link href="/conta/esqueci-senha" className="font-semibold text-blue hover:underline">
          Esqueci minha senha
        </Link>
        <p className="text-muted">
          Ainda não tem conta?{' '}
          <Link href="/conta/criar-conta" className="font-semibold text-blue hover:underline">
            Criar conta
          </Link>
        </p>
      </div>

      {veioDoCheckout && (
        <div className="mt-5 border-t border-line pt-4 text-center">
          <Link
            href="/checkout"
            className="group inline-flex items-center gap-1 py-1 text-[13.5px] font-bold text-navy hover:underline"
          >
            Continuar sem conta
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </Link>
          <p className="text-[12px] text-muted">Você não precisa de conta para comprar.</p>
        </div>
      )}
    </ContaMoldura>
  );
}
