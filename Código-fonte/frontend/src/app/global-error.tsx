'use client'; // Error boundary precisa ser Client Component.

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

// Último recurso: erro no próprio layout raiz, onde o error.tsx de cada área não
// alcança. Substitui o documento inteiro, então define <html>/<body> e não usa os
// estilos globais (ver docs do Next: file-conventions/error.md#global-error).
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '96px 16px',
          textAlign: 'center',
        }}
      >
        <title>Algo deu errado — Atlas Nova Clean</title>
        <h1 style={{ fontSize: 20, margin: 0 }}>Algo deu errado</h1>
        <p style={{ margin: 0, color: '#5b6b8c' }}>
          Não conseguimos carregar a loja agora. Tente de novo em instantes.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: '#0b1f4d',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
