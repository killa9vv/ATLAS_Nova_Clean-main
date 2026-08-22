'use client';

import { ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACAO_MS = 4000;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: 'bg-navy text-white',
  success: 'bg-green text-white',
  error: 'bg-white text-navy border border-line',
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast precisa ser usado dentro de <ToastProvider>');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // ids sequenciais bastam aqui — não precisa de crypto.randomUUID pra uma lista
  // que nunca sai da aba atual.
  const proximoId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = 'default') => {
    const id = proximoId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, DURACAO_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[400] flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={[
              'pointer-events-auto rounded-atlas-sm px-4 py-3 text-[13px] font-semibold shadow-atlas-lg',
              VARIANT_CLASSES[toast.variant],
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
