import { useSyncExternalStore } from 'react';

const CONSULTA_MENOS_MOVIMENTO = '(prefers-reduced-motion: reduce)';

function assinarMenosMovimento(aoMudar: () => void) {
  const consulta = window.matchMedia(CONSULTA_MENOS_MOVIMENTO);
  consulta.addEventListener('change', aoMudar);
  return () => consulta.removeEventListener('change', aoMudar);
}

export function useMenosMovimento(): boolean {
  return useSyncExternalStore(
    assinarMenosMovimento,
    () => window.matchMedia(CONSULTA_MENOS_MOVIMENTO).matches,
    () => false,
  );
}
