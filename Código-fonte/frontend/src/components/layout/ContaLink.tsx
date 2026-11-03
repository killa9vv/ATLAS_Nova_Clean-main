'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { obterSessaoCliente } from '@/lib/conta-auth';

// Mesmo cuidado de hidratação do CartProvider: começa "deslogado" (bate com o
// que o servidor sempre renderiza, sem acesso a localStorage) e só troca depois
// de montar no client.
export function ContaLink() {
  const pathname = usePathname();
  const [nome, setNome] = useState<string | null>(null);
  const [hidratado, setHidratado] = useState(false);

  // HeaderNav vive no layout raiz, montado uma única vez — sem reler a cada
  // troca de rota, login/logout (que só mudam a URL via router.push/replace,
  // sem remontar o layout) deixavam esse link preso no estado de antes de
  // entrar/sair até um refresh completo da página.
  useEffect(() => {
    const sessao = obterSessaoCliente();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNome(sessao?.cliente.nome.split(' ')[0] ?? null);
    setHidratado(true);
  }, [pathname]);

  if (!hidratado) {
    return <span className="inline-block w-10" aria-hidden="true" />;
  }

  return (
    <Link
      href={nome ? '/conta' : '/conta/entrar'}
      className="flex max-w-[80px] items-center text-[13px] font-semibold text-navy hover:text-blue"
    >
      {/* Em tela bem estreita o nome empurrava o carrinho pra fora: vira só o ícone. */}
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="min-[381px]:hidden"
      >
        <path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </svg>
      <span className="truncate max-[380px]:sr-only">{nome ?? 'Entrar'}</span>
    </Link>
  );
}
