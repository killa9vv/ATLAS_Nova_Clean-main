const MESSAGES = [
  'Inauguração — Av. Arthur Bernardes, 619, Campos dos Goytacazes',
  'Atacado e varejo para o seu comércio',
  'Pedido pronto em minutos pelo WhatsApp',
  'Marcas que você já confia: Ypê, Veja, OMO, Downy e mais',
];

// Faixa de avisos rolando. As mensagens são duplicadas (não clonadas via JS)
// para permitir rolagem contínua só com CSS (animate-scroll desloca 50%).
export function Ticker() {
  const items = [...MESSAGES, ...MESSAGES];

  return (
    <div
      className="overflow-hidden bg-navy py-2"
      style={{
        maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
      }}
    >
      <div className="motion-reduce:animate-none flex w-max animate-scroll gap-12 whitespace-nowrap">
        {items.map((message, i) => (
          <span
            key={i}
            className="flex items-center gap-2 text-xs font-semibold tracking-[0.03em] text-sky before:content-['★'] before:text-amber"
          >
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
