export interface FooterProps {
  /**
   * "full" (colunas de contato/categorias/políticas) é implementado pelo
   * cartão "Layout base e navegação". Este componente só cobre "simple" —
   * a barra final usada sozinha nas páginas legais.
   */
  variant: 'full' | 'simple';
}

export function Footer({ variant }: FooterProps) {
  if (variant === 'full') {
    throw new Error(
      'Footer variant="full" ainda não implementado — ver cartão "Layout base e navegação".',
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2.5 px-5 py-6 text-xs text-muted">
      <span>© {new Date().getFullYear()} Atlas Nova Clean</span>
      <span>Feito para facilitar o seu dia a dia.</span>
    </div>
  );
}
