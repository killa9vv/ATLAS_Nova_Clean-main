'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { limparSessaoCliente, obterSessaoCliente, type SessaoCliente } from '@/lib/conta-auth';
import { CHAVE_QUERY_CARRINHO } from '@/lib/cart-context';

const ITENS_NAV = [
  {
    href: '/conta',
    label: 'Dados cadastrais',
    icone: 'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  {
    href: '/conta/enderecos',
    label: 'Meus endereços',
    icone: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  {
    href: '/conta/pedidos',
    label: 'Meus pedidos',
    icone: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  },
];

// Mesmo gate client-side do painel admin (ver admin/(painel)/layout.tsx): a
// autorização de verdade é sempre o backend (JwtAuthGuard + @Roles(CLIENTE) em
// cada rota /clientes/me*). Fica "sessao: undefined" até o useEffect rodar pra
// nunca piscar conteúdo protegido antes de checar localStorage.
export default function ContaPainelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [sessao, setSessao] = useState<SessaoCliente | null | undefined>(undefined);

  useEffect(() => {
    const sessaoAtual = obterSessaoCliente();
    if (!sessaoAtual) {
      router.replace('/conta/entrar');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessao(sessaoAtual);
  }, [router]);

  function sair() {
    limparSessaoCliente();
    // Sem isso, o header continuaria mostrando o carrinho do cliente que acabou de
    // sair até alguma outra ação disparar um refetch (mesmo motivo do login/registro
    // — ver conta/entrar/page.tsx). Depois do logout, o carrinho passa a ser
    // resolvido só pelo sessionToken anônimo (X-Cart-Session).
    void queryClient.invalidateQueries({ queryKey: CHAVE_QUERY_CARRINHO });
    router.replace('/conta/entrar');
  }

  if (!sessao) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-muted">
        Carregando…
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between gap-3 rounded-atlas bg-navy p-5 text-white shadow-atlas-lg">
        <div className="flex min-w-0 items-center gap-3.5">
          <span
            aria-hidden="true"
            className="estrela-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white font-display text-xl font-bold uppercase text-navy"
          >
            {sessao.cliente.nome.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky/80">
              Minha conta
            </p>
            <h1 className="truncate font-display text-xl font-bold capitalize">
              Olá, {sessao.cliente.nome}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={sair}
          className="shrink-0 rounded-full border border-white/30 px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-white/10 motion-reduce:transition-none"
        >
          Sair
        </button>
      </div>

      <nav aria-label="Minha conta" className="mb-6 flex flex-wrap gap-2">
        {ITENS_NAV.map((item) => {
          // Com o começo do caminho, "Meus pedidos" segue ativo dentro do detalhe de um pedido.
          const ativo =
            item.href === '/conta' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? 'page' : undefined}
              className={[
                'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-[background-color,color,translate] duration-200 hover:-translate-y-0.5 motion-reduce:transition-none',
                ativo
                  ? 'border-navy bg-navy text-white'
                  : 'border-line bg-white text-navy hover:bg-sky',
              ].join(' ')}
            >
              <svg
                aria-hidden="true"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icone} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
  );
}
