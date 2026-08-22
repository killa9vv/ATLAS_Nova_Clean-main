'use client'; // error.tsx precisa ser Client Component — é um React Error Boundary.

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-5 py-24 text-center">
      <span className="font-display text-[64px] font-bold leading-none text-navy">:(</span>
      <h1 className="font-display text-xl font-bold text-navy">Algo deu errado</h1>
      <p className="text-[14px] text-muted">
        Não conseguimos carregar essa página agora. Tente de novo em instantes.
      </p>
      <Button onClick={() => retry()}>Tentar de novo</Button>
    </main>
  );
}
