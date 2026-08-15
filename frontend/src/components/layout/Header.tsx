import Image from 'next/image';
import Link from 'next/link';

export interface HeaderProps {
  /**
   * "full" (mega-menu, busca, botão de carrinho) é implementado pelo cartão
   * "Layout base e navegação". Este componente só cobre "simple" — o header
   * enxuto usado nas páginas legais (sem nav/busca/carrinho).
   */
  variant: 'full' | 'simple';
}

export function Header({ variant }: HeaderProps) {
  if (variant === 'full') {
    throw new Error(
      'Header variant="full" ainda não implementado — ver cartão "Layout base e navegação".',
    );
  }

  return (
    <header className="border-b border-line bg-paper/90">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={36} height={36} className="shrink-0" />
          <span className="font-display leading-none">
            <b className="block text-lg font-bold text-navy">Atlas Nova Clean</b>
          </span>
        </Link>
      </div>
    </header>
  );
}
