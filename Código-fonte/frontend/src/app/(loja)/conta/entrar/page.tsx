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

// Só o que a área do cliente faz de verdade (ver /conta/pedidos, /conta/enderecos e o
// pré-preenchimento em checkout/page.tsx).
const VANTAGENS = [
  'Acompanhe seus pedidos em um só lugar',
  'Guarde seus endereços de entrega',
  'Finalize a compra com os dados já preenchidos',
];

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
    <main className="mx-auto flex min-h-[70vh] max-w-[880px] items-center px-5 py-10">
      <div className="animate-card-in grid w-full overflow-hidden rounded-atlas border border-line bg-white shadow-atlas-lg motion-reduce:animate-none nav:grid-cols-2">
        <aside className="relative hidden flex-col justify-center overflow-hidden bg-navy p-9 text-white nav:flex">
          <span
            aria-hidden="true"
            className="animate-blob-float absolute -left-16 -top-24 h-[280px] w-[280px] rounded-full bg-blue opacity-50 blur-[70px] motion-reduce:animate-none"
          />
          <span
            aria-hidden="true"
            className="animate-blob-float absolute -bottom-28 -right-14 h-[260px] w-[260px] rounded-full bg-green opacity-30 blur-[70px] motion-reduce:animate-none"
            style={{ animationDelay: '-6s' }}
          />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky/80">
              Atlas Nova Clean
            </p>
            <p className="mt-2 font-display text-2xl font-bold leading-tight">
              Sua lista de compras sempre à mão
            </p>
            <ul className="mt-6 flex list-none flex-col gap-3.5 p-0">
              {VANTAGENS.map((vantagem, indice) => (
                <li key={vantagem} className="flex items-start gap-2.5 text-[13.5px] text-sky">
                  <span
                    aria-hidden="true"
                    className="estrela-pop mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14753c] text-white"
                    style={{ animationDelay: `${250 + indice * 140}ms` }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {vantagem}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="p-7 sm:p-9">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue nav:hidden">
            Atlas Nova Clean
          </p>
          <h1 className="font-display text-xl font-bold text-navy">Entrar na sua conta</h1>
          <p className="mt-1 text-[13px] text-muted">
            Acompanhe seus pedidos, endereços salvos e dados cadastrais.
          </p>

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
            {erro && (
              <p
                key={tentativasFalhas}
                role="alert"
                className="tremer rounded-atlas-sm bg-red-50 px-3 py-2 text-[13px] text-red-600"
              >
                {erro}
              </p>
            )}
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
        </div>
      </div>
    </main>
  );
}
