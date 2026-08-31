export interface StepperProps {
  quantidade: number;
  onChange: (novaQuantidade: number) => void;
  disabled?: boolean;
}

// quantidade 0 sinaliza remoção pro componente pai (ex.: página de carrinho remove
// o item da lista quando onChange é chamado com 0).
export function Stepper({ quantidade, onChange, disabled }: StepperProps) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-atlas-sm border border-line bg-white px-1.5 py-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(quantidade - 1)}
        aria-label="Diminuir quantidade"
        className="flex h-6 w-6 items-center justify-center rounded-atlas-sm text-navy hover:bg-sky disabled:cursor-not-allowed disabled:opacity-50"
      >
        −
      </button>
      <span className="min-w-5 text-center text-[13px] font-semibold text-ink">{quantidade}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(quantidade + 1)}
        aria-label="Aumentar quantidade"
        className="flex h-6 w-6 items-center justify-center rounded-atlas-sm text-navy hover:bg-sky disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
