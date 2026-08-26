import Link from 'next/link';

export interface FooterProps {
  /**
   * "full" (colunas de contato/categorias/políticas) é implementado pelo
   * cartão "Layout base e navegação". Este componente só cobre "simple" —
   * a barra final usada sozinha nas páginas legais.
   */
  variant: 'full' | 'simple';
}

const CATEGORY_LINKS = [
  { label: 'Limpeza', href: '/#limpeza' },
  { label: 'Descartáveis', href: '/#descartaveis' },
  { label: 'Papelaria', href: '/#papelaria' },
];

const SUPPORT_LINKS = [
  {
    label: 'Entre em contato',
    href: 'https://wa.me/5522997805258?text=Ol%C3%A1%2C%20preciso%20de%20ajuda',
  },
  {
    label: 'Solicitar devolução',
    href: 'https://wa.me/5522997805258?text=Ol%C3%A1%2C%20quero%20solicitar%20uma%20devolu%C3%A7%C3%A3o%20ou%20troca',
  },
  { label: 'Avaliações de clientes', href: '/#avaliacoes' },
];

const POLICY_LINKS = [
  { label: 'Política de entrega', href: '/politica-entrega' },
  { label: 'Política de devolução', href: '/politica-devolucao' },
  { label: 'Política de privacidade', href: '/politica-privacidade' },
  { label: 'Termos e condições', href: '/termos-condicoes' },
];

function BottomBar() {
  return (
    <div className="mx-auto mt-8 flex max-w-[1180px] flex-wrap justify-between gap-2.5 border-t border-[#1E2C4D] px-5 py-6 text-xs text-[#5F7099]">
      <span>© {new Date().getFullYear()} Atlas Nova Clean</span>
      <span>Feito para facilitar o seu dia a dia.</span>
    </div>
  );
}

export function Footer({ variant }: FooterProps) {
  if (variant === 'simple') {
    return (
      <footer className="bg-ink">
        <BottomBar />
      </footer>
    );
  }

  return (
    <footer className="bg-ink px-5 pb-6 pt-12 text-[#B9C8E8]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-[30px] nav:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <h4 className="mb-3 font-display text-sm text-white">Atlas Nova Clean</h4>
          <p className="text-[13px] leading-[1.7] text-[#94A6CC]">
            Av. Arthur Bernardes, 619 — Campos dos Goytacazes, RJ
            <br />
            Segunda a sábado, das 8h às 18h.
          </p>
          <div className="mt-4 flex gap-2.5">
            <a
              href="https://instagram.com/atlasnovaclean"
              target="_blank"
              rel="noopener"
              aria-label="Instagram da Atlas Nova Clean"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#132445] text-[#B9C8E8] transition-colors hover:bg-blue hover:text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="https://facebook.com/atlasnovaclean"
              target="_blank"
              rel="noopener"
              aria-label="Facebook da Atlas Nova Clean"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#132445] text-[#B9C8E8] transition-colors hover:bg-blue hover:text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 8h-2a2 2 0 00-2 2v10M9 13h4" />
                <path d="M15 3H6a3 3 0 00-3 3v12a3 3 0 003 3h9a3 3 0 003-3V6a3 3 0 00-3-3z" />
              </svg>
            </a>
            <a
              href="https://wa.me/5522997805258"
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp da Atlas Nova Clean"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#132445] text-[#B9C8E8] transition-colors hover:bg-blue hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.5A10 10 0 1012 2zm5.9 14.2c-.3.7-1.5 1.4-2.1 1.5-.5.1-1.2.2-3.5-.7-2.9-1.2-4.8-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .5 0 .7.5s.8 2 .9 2.1c.1.2.1.4 0 .6-.1.2-.2.3-.4.5-.2.2-.4.4-.5.6-.2.2-.4.4-.2.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.8.3.2.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.7-.1.3.1 1.9.9 2.2 1.1.3.1.5.2.6.3.1.2.1.9-.2 1.6z" />
              </svg>
            </a>
          </div>
        </div>

        <nav aria-label="Categorias">
          <h4 className="mb-3 font-display text-sm text-white">Categorias</h4>
          <ul className="list-none space-y-0 p-0 [&>li]:text-[13px] [&>li]:leading-[1.7] [&>li]:text-[#94A6CC]">
            {CATEGORY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Atendimento">
          <h4 className="mb-3 font-display text-sm text-white">Atendimento</h4>
          <ul className="list-none space-y-0 p-0 [&>li]:text-[13px] [&>li]:leading-[1.7] [&>li]:text-[#94A6CC]">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener' : undefined}
                  className="hover:text-white hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Políticas">
          <h4 className="mb-3 font-display text-sm text-white">Políticas</h4>
          <ul className="list-none space-y-0 p-0 [&>li]:text-[13px] [&>li]:leading-[1.7] [&>li]:text-[#94A6CC]">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <BottomBar />
    </footer>
  );
}
