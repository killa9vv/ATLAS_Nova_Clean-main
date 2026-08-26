'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Trava o scroll da página por trás, e devolve o foco pro elemento que abriu o
    // modal quando ele fechar — sem isso, usuário de teclado/leitor de tela perde o
    // lugar onde estava.
    const elementoAnterior = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    cardRef.current?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', aoTeclar);
      elementoAnterior?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/50 p-5"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-atlas bg-white p-6 shadow-atlas-lg focus:outline-none"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title && <h3 className="font-display text-lg font-bold text-navy">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sky hover:text-navy"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
