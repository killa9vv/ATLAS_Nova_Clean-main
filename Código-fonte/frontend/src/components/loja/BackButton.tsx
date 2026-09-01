'use client';

import { useRouter } from 'next/navigation';

// Mesmo botão "Voltar" do site antigo (#detail-back/#brand-back): usado nas telas
// de detalhe de produto e de marca, pra não depender de clicar na logo pra sair.
// router.back() volta pra onde a pessoa realmente veio (home, catálogo, outra
// marca) em vez de mandar sempre pro mesmo lugar fixo.
export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-7 inline-flex items-center gap-2 text-[14px] font-semibold text-navy hover:text-blue"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Voltar
    </button>
  );
}
