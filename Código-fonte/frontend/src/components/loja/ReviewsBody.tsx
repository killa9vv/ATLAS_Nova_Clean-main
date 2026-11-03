'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { ApiError } from '@/lib/http';
import { criarResenha, type Resenha } from '@/lib/resenhas';
import { useContagemAnimada } from '@/hooks/use-contagem-animada';
import { useEntradaNaTela } from '@/hooks/use-entrada-na-tela';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BolhaRecado, MuralResenhas } from './ReviewsMural';

const REACOES_POR_NOTA = [
  '',
  'Poxa, o que houve?',
  'Dá pra melhorar',
  'Foi ok',
  'Gostei!',
  'Adorei!',
];
// Com menos que isso, as barras por nota não dizem nada (uma avaliação só vira uma barra cheia).
const MINIMO_PARA_BARRAS = 3;
const NOTAS_DECRESCENTES = [5, 4, 3, 2, 1];

function formatarMedia(numero: number): string {
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Faíscas em círculo, a partir do centro do elemento pai (posição relativa).
function Faiscas({ quantidade, distancia }: { quantidade: number; distancia: number }) {
  return (
    <span aria-hidden="true">
      {Array.from({ length: quantidade }, (_, i) => {
        const angulo = (i / quantidade) * 2 * Math.PI;
        const estilo = {
          '--x': `${Math.round(Math.cos(angulo) * distancia)}px`,
          '--y': `${Math.round(Math.sin(angulo) * distancia)}px`,
          animationDelay: `${(i % 3) * 40}ms`,
        } as CSSProperties;
        return (
          <span key={i} className="faisca text-[13px] text-amber" style={estilo}>
            ★
          </span>
        );
      })}
    </span>
  );
}

export interface ReviewsBodyProps {
  resenhasIniciais: Resenha[];
}

export function ReviewsBody({ resenhasIniciais }: ReviewsBodyProps) {
  const { showToast } = useToast();
  const [resenhas, setResenhas] = useState(resenhasIniciais);
  const [nome, setNome] = useState('');
  const [comentario, setComentario] = useState('');
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [enviando, setEnviando] = useState(false);
  // Fica fixa no topo do mural: no meio da rolagem, quem acabou de enviar não veria a própria.
  const [recemEnviada, setRecemEnviada] = useState<Resenha | null>(null);
  const [envios, setEnvios] = useState(0);

  const { ref: cabecalhoRef, entrada } = useEntradaNaTela<HTMLDivElement>();

  const media =
    resenhas.length > 0 ? resenhas.reduce((soma, r) => soma + r.nota, 0) / resenhas.length : 0;
  const mediaRef = useContagemAnimada<HTMLSpanElement>(
    entrada === 'entrando',
    media,
    formatarMedia,
  );

  const temRascunho = nome.trim() !== '' || comentario.trim() !== '' || nota > 0;
  const outrasResenhas = recemEnviada
    ? resenhas.filter((resenha) => resenha.id !== recemEnviada.id)
    : resenhas;

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!nome.trim() || !comentario.trim() || nota === 0) {
      showToast('Preencha seu nome, escolha uma nota e escreva um comentário.', 'error');
      return;
    }

    setEnviando(true);
    try {
      const nova = await criarResenha({ nome: nome.trim(), nota, comentario: comentario.trim() });
      setResenhas((atual) => [nova, ...atual]);
      setRecemEnviada(nova);
      setEnvios((atual) => atual + 1);
      setNome('');
      setComentario('');
      setNota(0);
      showToast('Avaliação enviada, obrigado!', 'success');
    } catch (erro) {
      showToast(
        erro instanceof ApiError
          ? erro.message
          : 'Não foi possível enviar sua avaliação. Tente de novo.',
        'error',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div
        ref={cabecalhoRef}
        className={`mb-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 ${entrada === 'aguardando' ? 'opacity-0' : ''}`}
      >
        <div className="max-w-[60ch]">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue">
            Avaliações de clientes
          </p>
          <h2 className="font-display text-2xl font-bold text-navy">
            O que dizem sobre a{' '}
            {/* Marca-texto, inspirado em @spell/highlighted-text. Em aguardando, encolhe sem
                transição; ao mudar pra entrando, passa pelo nome da esquerda pra direita. */}
            <span className="relative inline-block whitespace-nowrap">
              <span
                aria-hidden="true"
                className={`absolute inset-x-[-0.15em] bottom-[0.08em] top-[0.45em] origin-left rounded-sm bg-amber/40 ${
                  entrada === 'aguardando'
                    ? 'scale-x-0'
                    : 'scale-x-100 transition-transform delay-300 duration-700 ease-out'
                }`}
              />
              <span className="relative">Atlas Nova Clean</span>
            </span>
          </h2>
        </div>

        {resenhas.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span
                ref={mediaRef}
                className="font-display text-[40px] font-bold leading-none text-navy"
              >
                {formatarMedia(media)}
              </span>
              <span className="mt-1 text-[15px] leading-none" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((valor) => (
                  <span
                    key={valor}
                    className={`${valor <= Math.round(media) ? 'text-amber' : 'text-line'} ${entrada === 'entrando' ? 'estrela-pop' : ''}`}
                    style={{ animationDelay: `${valor * 90}ms` }}
                  >
                    ★
                  </span>
                ))}
              </span>
              <span className="mt-1 text-[12px] text-muted">
                {resenhas.length} {resenhas.length === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>

            {resenhas.length >= MINIMO_PARA_BARRAS && (
              <div className="flex w-32 flex-col gap-1" aria-hidden="true">
                {NOTAS_DECRESCENTES.map((valor) => {
                  const fatia = resenhas.filter((r) => r.nota === valor).length / resenhas.length;
                  return (
                    <div key={valor} className="flex items-center gap-1.5">
                      <span className="w-2 font-mono text-[10px] text-muted">{valor}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                        <span
                          className="block h-full origin-left rounded-full bg-amber transition-transform duration-700 ease-out motion-reduce:transition-none"
                          style={{
                            transform: `scaleX(${entrada === 'aguardando' ? 0 : fatia})`,
                            transitionDelay: `${(5 - valor) * 70}ms`,
                          }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-7 nav:grid-cols-[1.3fr_1fr] nav:items-start">
        <div className="flex min-w-0 flex-col gap-3.5">
          {temRascunho && (
            <div className="bolha-chega px-1">
              <p className="mb-1 font-script text-xl leading-none text-blue">
                Assim vai ficar o seu recado:
              </p>
              <BolhaRecado
                nome={nome.trim() || 'Você'}
                nota={nota}
                comentario={comentario.trim() || 'Seu comentário aparece aqui...'}
                indice={2}
                className="max-w-md"
              />
            </div>
          )}

          {!temRascunho && recemEnviada && (
            <div key={recemEnviada.id} className="bolha-chega px-1">
              <p className="mb-1 font-script text-xl leading-none text-green">
                Prontinho, seu recado já está no mural!
              </p>
              <BolhaRecado
                nome={recemEnviada.nome}
                nota={recemEnviada.nota}
                comentario={recemEnviada.comentario}
                data={recemEnviada.createdAt}
                indice={2}
                className="max-w-md"
              />
            </div>
          )}

          {resenhas.length === 0 && !temRascunho && (
            <div className="rounded-2xl border-2 border-dashed border-line bg-white/60 p-8 text-center">
              <span className="block text-[28px] leading-none text-line" aria-hidden="true">
                ★★★★★
              </span>
              <p className="mt-3 font-script text-[28px] leading-tight text-navy">
                Este mural está esperando o primeiro recado
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Comprou com a gente? Escreva no formulário e veja o seu recado aparecer aqui.
              </p>
            </div>
          )}

          {outrasResenhas.length > 0 && <MuralResenhas resenhas={outrasResenhas} />}
        </div>

        <div className="rounded-atlas border border-line bg-white p-[22px] nav:sticky nav:top-[90px]">
          <h3 className="mb-4 text-base font-bold text-navy">Deixe sua avaliação</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <Input
              label="Seu nome"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-navy">Sua nota</span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex gap-1.5" onMouseLeave={() => setNotaHover(0)}>
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <button
                      key={valor}
                      type="button"
                      aria-label={`${valor} estrela${valor > 1 ? 's' : ''}`}
                      aria-pressed={nota === valor}
                      onMouseEnter={() => setNotaHover(valor)}
                      onClick={() => setNota(valor)}
                      className={[
                        'relative text-[26px] leading-none transition-[scale,color] duration-150 hover:scale-125 active:scale-90 motion-reduce:transition-none',
                        valor <= (notaHover || nota) ? 'text-amber' : 'text-line',
                      ].join(' ')}
                    >
                      <span
                        className={valor <= nota ? 'estrela-pop' : 'inline-block'}
                        style={{ animationDelay: `${(valor - 1) * 40}ms` }}
                      >
                        ★
                      </span>
                      {valor === nota && <Faiscas key={nota} quantidade={6} distancia={26} />}
                    </button>
                  ))}
                </div>
                <span
                  aria-live="polite"
                  className="min-h-7 font-script text-[22px] leading-7 text-blue"
                >
                  {REACOES_POR_NOTA[notaHover || nota]}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rev-comentario" className="text-[13px] font-semibold text-navy">
                Comentário
              </label>
              <textarea
                id="rev-comentario"
                rows={3}
                placeholder="Conte como foi sua experiência"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                required
                className="rounded-atlas-sm border border-line bg-white px-3.5 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-blue/40"
              />
            </div>
            <div className="relative flex flex-col">
              <Button type="submit" disabled={enviando} className="justify-center">
                {enviando ? 'Enviando...' : 'Enviar avaliação'}
              </Button>
              {envios > 0 && <Faiscas key={envios} quantidade={14} distancia={90} />}
            </div>
          </form>
          <p className="mt-3.5 text-[11px] leading-[1.5] text-muted">
            Sua avaliação fica pública nesta página assim que enviada.
          </p>
        </div>
      </div>
    </>
  );
}
