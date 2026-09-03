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
      className="max-w-[80px] truncate text-[13px] font-semibold text-navy hover:text-blue"
    >
      {nome ?? 'Entrar'}
    </Link>
  );
}
