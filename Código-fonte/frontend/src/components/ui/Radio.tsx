import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, id, className = '', ...props },
  ref,
) {
  const idGerado = useId();
  const inputId = id ?? idGerado;

  return (
    <label
      htmlFor={inputId}
      className="flex items-center gap-2.5 rounded-atlas-sm border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink has-[:checked]:border-blue has-[:checked]:bg-sky"
    >
      <input
        ref={ref}
        id={inputId}
        type="radio"
        className={[
          'h-4 w-4 accent-blue focus:outline-none focus:ring-2 focus:ring-blue/40',
          className,
        ].join(' ')}
        {...props}
      />
      <span className="font-semibold text-navy">{label}</span>
    </label>
  );
});
