import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...props },
  ref,
) {
  const idGerado = useId();
  const inputId = id ?? idGerado;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-navy">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[
          'rounded-atlas-sm border bg-white px-3.5 py-2.5 font-sans text-[13px] text-ink',
          'focus:outline-none focus:ring-2 focus:ring-blue/40',
          error ? 'border-red-400' : 'border-line',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-xs font-medium text-red-500">
          {error}
        </span>
      )}
    </div>
  );
});
