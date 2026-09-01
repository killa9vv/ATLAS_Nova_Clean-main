const WHATSAPP_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '';

// Botão flutuante fixo em toda a loja (não só a home), com anel pulsante —
// mesmo padrão visual do site antigo.
export function WhatsAppFab() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMERO}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chamar no WhatsApp"
      className="fixed bottom-5 right-5 z-[200] flex h-14 w-14 items-center justify-center rounded-full bg-green text-white shadow-atlas-lg"
    >
      <span
        aria-hidden="true"
        className="animate-fab-pulse motion-reduce:animate-none absolute inset-0 rounded-full bg-green/60"
      />
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="relative"
        aria-hidden="true"
      >
        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2Zm5.79 14.06c-.24.68-1.4 1.3-1.93 1.35-.5.05-1.13.28-3.77-.8-3.16-1.29-5.19-4.5-5.34-4.71-.16-.21-1.29-1.71-1.29-3.27 0-1.55.82-2.31 1.11-2.63.29-.32.63-.4.84-.4.21 0 .42 0 .6.01.19.01.45-.07.7.54.26.62.87 2.14.95 2.29.08.16.13.34.03.55-.11.21-.16.34-.32.52-.16.18-.34.4-.48.54-.16.16-.33.33-.14.65.19.32.85 1.4 1.83 2.27 1.26 1.12 2.32 1.47 2.64 1.63.32.16.51.13.7-.08.19-.21.81-.94 1.03-1.27.21-.32.42-.27.71-.16.29.11 1.85.87 2.16 1.03.32.16.53.24.61.37.08.13.08.75-.15 1.43Z" />
      </svg>
    </a>
  );
}
