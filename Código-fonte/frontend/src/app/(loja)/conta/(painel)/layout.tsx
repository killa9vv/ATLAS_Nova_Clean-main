'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { limparSessaoCliente, obterSessaoCliente, type SessaoCliente } from '@/lib/conta-auth';

const ITENS_NAV = [
  { href: '/conta', label: 'Dados cadastrais' },
  { href: '/conta/enderecos', label: 'Meus endereços' },
  { href: '/conta/pedidos', label: 'Meus pedidos' },
];

// Mesmo gate client-side do painel admin (ver admin/(painel)/layout.tsx): a
// autorização de verdade é sempre o backend (JwtAuthGuard + @Roles(CLIENTE) em
// cada rota /clientes/me*). Fica "sessao: undefined" até o useEffect rodar pra
// nunca piscar conteúdo protegido antes de checar localStorage.
export default function ContaPainelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue">Minha conta</p>
          <h1 className="font-display text-xl font-bold text-navy">Olá, {sessao.cliente.nome}</h1>
        </div>
        <button
          type="button"
          onClick={sair}
          className="text-[13px] font-semibold text-blue hover:underline"
        >
          Sair
        </button>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2">
        {ITENS_NAV.map((item) => {
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                ativo
                  ? 'border-navy bg-navy text-white'
                  : 'border-line bg-white text-navy hover:bg-sky',
              ].join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </main>
  );
}
