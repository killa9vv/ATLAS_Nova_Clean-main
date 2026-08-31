'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { limparSessaoAdmin, obterSessaoAdmin, type SessaoAdmin } from '@/lib/admin-auth';

const ITENS_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/estoque', label: 'Estoque' },
  { href: '/admin/cupons', label: 'Cupons & banners' },
];

// Gate client-side: evita que o front mostre tela protegida sem sessão local,
// mas a autorização de verdade é sempre o backend (JwtAuthGuard/RolesGuard em
// cada rota /admin/* da API — ver pedidos.controller.ts, produtos.controller.ts
// etc). Fica "sessao: undefined" até o useEffect rodar pra nunca piscar conteúdo
// protegido antes de checar localStorage — que não existe durante SSR/build, e
// não dá pra ler no lazy initializer do useState sem arriscar hydration mismatch
// (servidor sempre renderiza sem sessão, client pode já ter uma).
export default function PainelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessao, setSessao] = useState<SessaoAdmin | null | undefined>(undefined);

  useEffect(() => {
    const sessaoAtual = obterSessaoAdmin();
    if (sessaoAtual?.usuario.papel !== 'ADMIN') {
      router.replace('/admin/login');
      return;
    }
    // Sincronizando com localStorage (só existe no client, depois de montar) —
    // não deriva de outro estado/prop, é o caso legítimo do próprio guia do lint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessao(sessaoAtual);
  }, [router]);

  function sair() {
    limparSessaoAdmin();
    router.replace('/admin/login');
  }

  if (!sessao) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[13px] text-muted">
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col bg-gradient-to-b from-navy to-navy-2 p-4 text-white">
        <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4 font-display text-[13px] tracking-wide">
          ATLAS <span className="text-blue">ADMIN</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {ITENS_NAV.map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'rounded-atlas-sm px-3 py-2.5 text-[14px] font-medium transition-colors',
                  ativo
                    ? 'bg-blue/20 font-semibold text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4 text-[12.5px]">
          <span className="truncate">{sessao.usuario.nome}</span>
          <button type="button" onClick={sair} className="font-semibold text-blue hover:underline">
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
