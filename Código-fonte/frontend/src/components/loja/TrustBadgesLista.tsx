'use client';

import { useContagemAnimada } from '@/hooks/use-contagem-animada';
import { useEntradaNaTela, type EntradaNaTela } from '@/hooks/use-entrada-na-tela';

const ATRASO_ENTRE_SELOS_MS = 140;

function formatarContagem(numero: number): string {
  return String(Math.round(numero));
}

function TextoCatalogo({ total, entrada }: { total: number; entrada: EntradaNaTela }) {
  const ref = useContagemAnimada<HTMLSpanElement>(entrada === 'entrando', total, formatarContagem);
  return (
    <>
      +<span ref={ref}>{total}</span> produtos no catálogo
    </>
  );
}

export function TrustBadgesLista({ totalProdutos }: { totalProdutos: number | null }) {
  const { ref, entrada } = useEntradaNaTela<HTMLDivElement>();

  const selos = [
    {
      icone: '🔒',
      texto: 'Pagamento seguro',
      detalhe: 'Pix e cartão via Mercado Pago',
    },
    {
      icone: '💬',
      texto: 'Atendimento direto',
      detalhe: 'Fala com a gente pelo WhatsApp',
    },
    {
      icone: '🧴',
      texto:
        totalProdutos !== null ? (
          <TextoCatalogo total={totalProdutos} entrada={entrada} />
        ) : (
          'Catálogo com limpeza, descartáveis e papelaria'
        ),
      detalhe: 'Atacado e varejo, mesmo preço',
    },
  ];

  return (
    <div ref={ref} className="mx-auto grid max-w-[1180px] gap-3 px-5 nav:grid-cols-3">
      {selos.map((selo, indice) => {
        const atraso = { animationDelay: `${indice * ATRASO_ENTRE_SELOS_MS}ms` };
        return (
          <div
            key={selo.icone}
            className={`relative flex items-center gap-3 overflow-hidden rounded-atlas border border-line bg-white p-4 shadow-atlas ${
              entrada === 'aguardando'
                ? 'opacity-0'
                : entrada === 'entrando'
                  ? 'animate-card-in'
                  : ''
            }`}
            style={atraso}
          >
            {entrada === 'entrando' && (
              <span
                aria-hidden="true"
                className="brilho-passa pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-blue/10"
                style={{ animationDelay: `${300 + indice * ATRASO_ENTRE_SELOS_MS}ms` }}
              />
            )}
            <span
              className={`text-2xl ${entrada === 'entrando' ? 'estrela-pop' : ''}`}
              style={{ animationDelay: `${200 + indice * ATRASO_ENTRE_SELOS_MS}ms` }}
              aria-hidden="true"
            >
              {selo.icone}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold tabular-nums text-navy">
                {selo.texto}
              </span>
              <span className="text-[12px] text-muted">{selo.detalhe}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
