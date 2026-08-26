import { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['rounded-atlas border border-line bg-white p-4 shadow-atlas', className].join(
        ' ',
      )}
      {...props}
    />
  );
}
