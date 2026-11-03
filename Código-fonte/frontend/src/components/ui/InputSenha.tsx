'use client';

import { useState, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { Input } from './Input';

export interface InputSenhaProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

// Mostrar a senha e avisar do Caps Lock: as duas causas mais comuns de "senha incorreta".
export function InputSenha({ label, onBlur, ...props }: InputSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const [capsLigado, setCapsLigado] = useState(false);

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    setCapsLigado(evento.getModifierState('CapsLock'));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Input
          label={label}
          type={visivel ? 'text' : 'password'}
          className="w-full pr-11"
          onKeyDown={aoTeclar}
          onKeyUp={aoTeclar}
          onBlur={(evento) => {
            setCapsLigado(false);
            onBlur?.(evento);
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visivel}
          className="absolute bottom-0.5 right-0.5 flex h-10 w-10 items-center justify-center rounded-atlas-sm text-muted transition-colors hover:text-navy motion-reduce:transition-none"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
            {visivel && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {capsLigado && (
        <p className="text-[12px] font-semibold text-[#9a5b00]" role="status">
          Caps Lock ligado
        </p>
      )}
    </div>
  );
}
