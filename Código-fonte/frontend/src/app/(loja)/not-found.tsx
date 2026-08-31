import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[560px] flex-col items-center gap-4 px-5 py-24 text-center">
      <span className="font-display text-[64px] font-bold leading-none text-navy">404</span>
      <h1 className="font-display text-xl font-bold text-navy">Página não encontrada</h1>
      <p className="text-[14px] text-muted">
        O link que você seguiu pode estar quebrado, ou a página pode ter sido movida.
      </p>
      <Link href="/">
        <Button>Voltar pra loja</Button>
      </Link>
    </main>
  );
}
