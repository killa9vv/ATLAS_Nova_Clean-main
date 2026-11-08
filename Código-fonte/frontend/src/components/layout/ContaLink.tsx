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
      className="flex max-w-[104px] items-center gap-1.5 rounded-[20px] text-[13px] font-semibold text-navy transition-colors hover:text-blue motion-reduce:transition-none nav:px-2.5 nav:py-2 nav:hover:bg-sky"
    >
      {/* Em tela bem estreita o nome empurrava o carrinho pra fora: vira só o ícone. Em tela
          média o nome basta, sem o ícone ocupando o espaço; no computador, cabem os dois. */}
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 min-[380px]:max-nav:hidden"
      >
        <path d="M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      </svg>
      <span className="truncate max-[380px]:sr-only nav:max-[1024px]:sr-only">
        {nome ?? 'Entrar'}
      </span>
    </Link>
  );
}
