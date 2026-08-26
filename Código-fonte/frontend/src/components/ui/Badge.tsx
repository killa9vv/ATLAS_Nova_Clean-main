import { HTMLAttributes } from 'react';

export type BadgeVariant = 'navy' | 'amber' | 'green' | 'sky';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  navy: 'bg-navy text-white',
  amber: 'bg-amber text-navy',
  green: 'bg-green text-white',
  sky: 'bg-sky text-navy',
};

export function Badge({ variant = 'sky', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-[14px] px-2.5 py-1 text-[11.5px] font-bold',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
      {...props}
    />
  );
}
