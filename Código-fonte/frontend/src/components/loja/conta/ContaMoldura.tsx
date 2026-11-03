import type { ReactNode } from 'react';

// Só o que a área do cliente faz de verdade (ver /conta/pedidos, /conta/enderecos e o
// pré-preenchimento em checkout/page.tsx).
const VANTAGENS = [
  'Acompanhe seus pedidos em um só lugar',
  'Guarde seus endereços de entrega',
  'Finalize a compra com os dados já preenchidos',
];

export interface ContaMolduraProps {
  titulo: string;
  descricao?: ReactNode;
  children: ReactNode;
}

// Moldura das telas de acesso (entrar, criar conta, recuperar senha, ativar): formulário de um
// lado e, no computador, o painel que explica pra que serve a conta.
export function ContaMoldura({ titulo, descricao, children }: ContaMolduraProps) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[880px] items-center px-5 py-10">
      <div className="animate-card-in grid w-full overflow-hidden rounded-atlas border border-line bg-white shadow-atlas-lg motion-reduce:animate-none nav:grid-cols-2">
        <aside className="relative hidden flex-col justify-center overflow-hidden bg-navy p-9 text-white nav:flex">
          <span
            aria-hidden="true"
            className="animate-blob-float absolute -left-16 -top-24 h-[280px] w-[280px] rounded-full bg-blue opacity-50 blur-[70px] motion-reduce:animate-none"
          />
          <span
            aria-hidden="true"
            className="animate-blob-float absolute -bottom-28 -right-14 h-[260px] w-[260px] rounded-full bg-green opacity-30 blur-[70px] motion-reduce:animate-none"
            style={{ animationDelay: '-6s' }}
          />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky/80">
              Atlas Nova Clean
            </p>
            <p className="mt-2 font-display text-2xl font-bold leading-tight">
              Sua lista de compras sempre à mão
            </p>
            <ul className="mt-6 flex list-none flex-col gap-3.5 p-0">
              {VANTAGENS.map((vantagem, indice) => (
                <li key={vantagem} className="flex items-start gap-2.5 text-[13.5px] text-sky">
                  <span
                    aria-hidden="true"
                    className="estrela-pop mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14753c] text-white"
                    style={{ animationDelay: `${250 + indice * 140}ms` }}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {vantagem}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="p-7 sm:p-9">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-blue nav:hidden">
            Atlas Nova Clean
          </p>
          <h1 className="font-display text-xl font-bold text-navy">{titulo}</h1>
          {descricao && <p className="mt-1 text-[13px] text-muted">{descricao}</p>}
          {children}
        </div>
      </div>
    </main>
  );
}

// Confirmação de envio ou de ação concluída nas telas de acesso.
export function ContaAviso({ children }: { children: ReactNode }) {
  return (
    <div
      className="bolha-chega mt-6 flex items-start gap-3 rounded-atlas-sm bg-sky p-3.5"
      role="status"
    >
      <span
        aria-hidden="true"
        className="estrela-pop flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#14753c] text-white"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <p className="text-[13px] leading-relaxed text-navy">{children}</p>
    </div>
  );
}

export function ContaErro({ children, tentativa }: { children: ReactNode; tentativa?: number }) {
  return (
    <p
      key={tentativa}
      role="alert"
      className="tremer rounded-atlas-sm bg-red-50 px-3 py-2 text-[13px] text-red-600"
    >
      {children}
    </p>
  );
}
