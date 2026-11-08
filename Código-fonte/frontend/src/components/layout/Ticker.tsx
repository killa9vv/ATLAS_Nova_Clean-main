import Link from 'next/link';
import { hrefWhatsApp } from '@/lib/whatsapp';

const ENDERECO = 'Av. Arthur Bernardes, 619, Campos dos Goytacazes';

const MENSAGENS = [
  {
    texto: `Inauguração — ${ENDERECO}`,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO)}`,
  },
  { texto: 'Atacado e varejo, com desconto por quantidade', href: '/catalogo' },
  { texto: 'Faça seu pedido pelo WhatsApp', href: hrefWhatsApp('Olá, quero fazer um pedido') },
  { texto: 'Marcas que você já confia: Ypê, Veja, OMO, Downy e mais', href: '/#marcas' },
];

// Quantas vezes a lista se repete: animate-scroll anda 50%, então metade das cópias precisa
// cobrir sozinha a tela inteira, senão sobra um buraco no fim da volta em monitor largo.
const COPIAS = 4;
const SEGUNDOS_POR_COPIA = 22;

// Faixa de avisos rolando. As mensagens são repetidas (não clonadas via JS) para permitir
// rolagem contínua só com CSS. O espaço é padding do item, não gap: com gap, a metade da faixa
// cai no meio de um espaço e a rolagem dá um pulo a cada volta.
export function Ticker() {
  return (
    <div
      className="group/faixa overflow-hidden bg-navy py-2"
      style={{
        maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
      }}
    >
      <div
        className="flex w-max animate-scroll whitespace-nowrap group-focus-within/faixa:[animation-play-state:paused] group-hover/faixa:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center"
        style={{ animationDuration: `${(COPIAS / 2) * SEGUNDOS_POR_COPIA}s` }}
      >
        {Array.from({ length: COPIAS }, (_, copia) => (
          // Só a primeira cópia existe pro leitor de tela e pro Tab; o resto é repetição visual.
          <div
            key={copia}
            aria-hidden={copia > 0 || undefined}
            className={`flex shrink-0 motion-reduce:flex-wrap motion-reduce:justify-center ${copia > 0 ? 'motion-reduce:hidden' : ''}`}
          >
            {MENSAGENS.map((mensagem) => {
              const externo = mensagem.href.startsWith('http');
              return (
                <Link
                  key={mensagem.texto}
                  href={mensagem.href}
                  target={externo ? '_blank' : undefined}
                  rel={externo ? 'noopener noreferrer' : undefined}
                  tabIndex={copia > 0 ? -1 : undefined}
                  className="group/aviso flex items-center gap-2 pr-12 text-xs font-semibold tracking-[0.03em] text-sky before:text-amber before:transition-transform before:duration-200 before:content-['★'] hover:text-white hover:underline hover:before:rotate-45 hover:before:scale-125 motion-reduce:before:transition-none"
                >
                  {mensagem.texto}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
