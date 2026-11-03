'use client';

import { useSyncExternalStore } from 'react';

// Mesmo horário escrito no rodapé: segunda a sábado, das 8h às 18h.
const HORA_ABRE = 8;
const HORA_FECHA = 18;
const INTERVALO_CHECAGEM_MS = 60_000;

// Pelo fuso da loja, não o do aparelho de quem está vendo.
function lojaAberta(): boolean {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const diaDaSemana = partes.find((parte) => parte.type === 'weekday')?.value;
  const hora = Number(partes.find((parte) => parte.type === 'hour')?.value);
  return diaDaSemana !== 'Sun' && hora >= HORA_ABRE && hora < HORA_FECHA;
}

function assinarRelogio(aoMudar: () => void) {
  const id = setInterval(aoMudar, INTERVALO_CHECAGEM_MS);
  return () => clearInterval(id);
}

// Depende da hora de quem vê: no HTML do servidor fica vazio, pra não divergir no navegador.
export function StatusLoja() {
  const aberta = useSyncExternalStore(assinarRelogio, lojaAberta, () => null);
  if (aberta === null) return null;

  return (
    <span className="ml-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#132445] px-2 py-0.5 text-[11px] font-semibold text-[#B9C8E8]">
      <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
        {aberta && (
          <span className="absolute inset-0 animate-ping rounded-full bg-green motion-reduce:hidden" />
        )}
        <span
          className={`relative h-1.5 w-1.5 rounded-full ${aberta ? 'bg-green' : 'bg-[#5F7099]'}`}
        />
      </span>
      {aberta ? 'Aberto agora' : 'Fechado agora'}
    </span>
  );
}
