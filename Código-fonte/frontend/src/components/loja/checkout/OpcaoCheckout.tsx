import type { ReactNode } from 'react';

export interface OpcaoCheckoutProps {
  nome: string;
  titulo: string;
  descricao: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}

export function OpcaoCheckout({
  nome,
  titulo,
  descricao,
  checked,
  disabled,
  onChange,
}: OpcaoCheckoutProps) {
  return (
    <label
      className={[
        'flex cursor-pointer items-start gap-2.5 rounded-atlas-sm border bg-white p-3.5 transition-[border-color,background-color,box-shadow] duration-200 motion-reduce:transition-none',
        checked ? 'border-blue bg-sky shadow-atlas' : 'border-line hover:border-muted',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ].join(' ')}
    >
      <input
        type="radio"
        name={nome}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 accent-blue"
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold text-navy">{titulo}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted">{descricao}</span>
      </span>
    </label>
  );
}
