const ETAPAS = ['Identificação', 'Entrega', 'Revisão'];

export interface CheckoutEtapasProps {
  atual: number;
  /** Sem isso, as etapas já feitas não são clicáveis (ex.: pagamento em análise). */
  aoIrPara?: (etapa: number) => void;
}

export function CheckoutEtapas({ atual, aoIrPara }: CheckoutEtapasProps) {
  return (
    <ol className="mb-8 flex list-none items-center gap-2 p-0 text-[13px] font-semibold">
      {ETAPAS.map((nome, indice) => {
        const feita = indice < atual;
        const conteudo = (
          <>
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-colors duration-300 motion-reduce:transition-none ${
                feita
                  ? 'bg-[#14753c] text-white'
                  : indice === atual
                    ? 'bg-navy text-white'
                    : 'bg-line text-muted'
              }`}
            >
              {feita ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="estrela-pop"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                indice + 1
              )}
            </span>
            {/* No celular só a etapa atual leva o nome: os três não caberiam numa linha. */}
            <span className={indice === atual ? 'text-navy' : 'hidden text-muted sm:inline'}>
              {nome}
            </span>
          </>
        );

        return (
          <li
            key={nome}
            aria-current={indice === atual ? 'step' : undefined}
            className="flex min-w-0 items-center gap-2"
          >
            {indice > 0 && (
              <span
                className="h-0.5 w-5 overflow-hidden rounded-full bg-line sm:w-8"
                aria-hidden="true"
              >
                <span
                  className="block h-full origin-left bg-[#14753c] transition-transform duration-500 motion-reduce:transition-none"
                  style={{ transform: `scaleX(${indice <= atual ? 1 : 0})` }}
                />
              </span>
            )}
            {feita && aoIrPara ? (
              <button
                type="button"
                onClick={() => aoIrPara(indice)}
                aria-label={`Voltar para ${nome}`}
                className="flex items-center gap-2 rounded-full hover:underline"
              >
                {conteudo}
              </button>
            ) : (
              <span className="flex items-center gap-2">{conteudo}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
