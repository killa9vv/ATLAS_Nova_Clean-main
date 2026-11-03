'use client';

import { PalavrasStagger } from '@/components/ui/PalavrasStagger';
import { useEntradaNaTela } from '@/hooks/use-entrada-na-tela';

const WHATSAPP_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '';

// Tempos da conversa ilustrativa, em segundos.
const ATRASO_LISTA_S = 0.9;
const ATRASO_DIGITANDO_S = 1.6;
const ATRASO_RESPOSTA_S = 2.6;

// Ilustra o "manda sua lista": os itens são só exemplos das três categorias da loja, e a
// resposta não promete prazo nenhum. Decorativa, por isso fora do leitor de tela e do celular.
function ConversaIlustrativa({ entrando, escondida }: { entrando: boolean; escondida: boolean }) {
  const classeChegada = `${entrando ? 'bolha-chega' : ''} ${escondida ? 'opacity-0' : ''}`;
  const classeBalao =
    'rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-snug shadow-atlas-lg';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1180px] items-center justify-between px-5 lg:flex"
    >
      <div className="flex w-[230px] -rotate-2 flex-col items-start gap-2">
        <p
          className={`${classeBalao} ${classeChegada} rounded-bl-sm bg-white text-navy`}
          style={{ animationDelay: '0.3s' }}
        >
          Oi! Segue minha lista:
        </p>
        <p
          className={`${classeBalao} ${classeChegada} rounded-bl-sm bg-white text-navy`}
          style={{ animationDelay: `${ATRASO_LISTA_S}s` }}
        >
          2 detergentes
          <br />1 pacote de copos
          <br />1 caixa de canetas
        </p>
      </div>

      <div className="grid w-[230px] rotate-2 justify-items-end">
        {entrando && (
          <span
            className={`digitando ${classeBalao} flex items-center gap-1 self-center rounded-br-sm bg-[#d9fdd3] [grid-area:1/1]`}
            style={{ animationDelay: `${ATRASO_DIGITANDO_S}s` }}
          >
            {[0, 1, 2].map((ponto) => (
              <span
                key={ponto}
                className="h-1.5 w-1.5 rounded-full bg-navy/60"
                style={{ animationDelay: `${ponto * 0.15}s` }}
              />
            ))}
          </span>
        )}
        <p
          className={`${classeBalao} ${classeChegada} rounded-br-sm bg-[#d9fdd3] text-navy [grid-area:1/1]`}
          style={{ animationDelay: `${ATRASO_RESPOSTA_S}s` }}
        >
          Recebido! Vamos conferir tudo com você. ✓✓
        </p>
      </div>
    </div>
  );
}

export function CtaBand() {
  const { ref, entrada } = useEntradaNaTela<HTMLElement>();
  const entrando = entrada === 'entrando';
  const escondida = entrada === 'aguardando';

  return (
    <section ref={ref} className="relative overflow-hidden bg-navy px-5 py-12 text-center">
      <span
        aria-hidden="true"
        className="animate-blob-float motion-reduce:animate-none absolute -left-16 -top-32 h-[320px] w-[320px] rounded-full bg-blue opacity-50 blur-[80px]"
      />
      <span
        aria-hidden="true"
        className="animate-blob-float motion-reduce:animate-none absolute -bottom-40 -right-10 h-[340px] w-[340px] rounded-full bg-green opacity-30 blur-[80px]"
        style={{ animationDelay: '-6s' }}
      />

      <ConversaIlustrativa entrando={entrando} escondida={escondida} />

      <div className={`relative ${escondida ? 'opacity-0' : ''}`}>
        <h2 className="font-display text-2xl font-bold text-white">
          <PalavrasStagger texto="Pronto pra fazer seu pedido?" animar={entrando} stagger={0.08} />
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-sky/80">
          Manda sua lista no WhatsApp e a gente confirma tudo rapidinho.
        </p>
        <span className="relative mt-6 inline-flex">
          <span
            aria-hidden="true"
            className="anel-botao absolute inset-0 rounded-full bg-green/60 motion-reduce:hidden"
          />
          <a
            href={`https://wa.me/${WHATSAPP_NUMERO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="botao-apertar group relative inline-flex items-center gap-2 rounded-full bg-green px-6 py-3 text-[14px] font-bold text-white"
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
              className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110 motion-reduce:transition-none"
            >
              <path d="M21 12a9 9 0 0 1-13.2 8L3 21l1.1-4.7A9 9 0 1 1 21 12z" />
            </svg>
            Chamar no WhatsApp
          </a>
        </span>
      </div>
    </section>
  );
}
