'use client';

import { useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/http';
import { criarResenha, type Resenha } from '@/lib/resenhas';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function Estrelas({ nota, tamanho = 'text-sm' }: { nota: number; tamanho?: string }) {
  return (
    <span className={tamanho} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < nota ? 'text-amber' : 'text-line'}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

  const media =
    resenhas.length > 0 ? resenhas.reduce((soma, r) => soma + r.nota, 0) / resenhas.length : 0;

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
    <div className="grid gap-7 nav:grid-cols-[1.3fr_1fr] nav:items-start">
      <div className="flex flex-col gap-3.5">
        {resenhas.length > 0 && (
          <div className="mb-1 flex flex-wrap items-center gap-2.5">
            <Estrelas nota={Math.round(media)} tamanho="text-lg" />
            <span className="font-mono text-base font-bold text-navy">{media.toFixed(1)}</span>
            <span className="text-[13px] text-muted">
              {resenhas.length} {resenhas.length === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </div>
        )}

        <div className="flex max-h-[520px] flex-col gap-3.5 overflow-y-auto pr-1">
          {resenhas.length === 0 && (
            <div className="rounded-atlas border border-dashed border-line bg-white p-6 text-center text-[13px] text-muted">
              Nenhuma avaliação ainda. Assim que alguém avaliar, aparece aqui.
            </div>
          )}
          {resenhas.map((resenha) => (
            <div key={resenha.id} className="rounded-atlas border border-line bg-white p-[18px]">
              <div className="mb-1.5 flex items-start justify-between gap-2.5">
                <span className="text-[13px] font-bold text-navy">{resenha.nome}</span>
                <span className="font-mono text-[11px] text-muted">
                  {formatarData(resenha.createdAt)}
                </span>
              </div>
              <Estrelas nota={resenha.nota} />
              <p className="mt-2 text-[13px] leading-[1.55] text-ink">{resenha.comentario}</p>
            </div>
          ))}
        </div>
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
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  aria-label={`${valor} estrela${valor > 1 ? 's' : ''}`}
                  onMouseEnter={() => setNotaHover(valor)}
                  onMouseLeave={() => setNotaHover(0)}
                  onClick={() => setNota(valor)}
                  className={[
                    'text-[26px] leading-none transition-transform hover:scale-110',
                    valor <= (notaHover || nota) ? 'text-amber' : 'text-line',
                  ].join(' ')}
                >
                  ★
                </button>
              ))}
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
          <Button type="submit" disabled={enviando} className="justify-center">
            {enviando ? 'Enviando...' : 'Enviar avaliação'}
          </Button>
        </form>
        <p className="mt-3.5 text-[11px] leading-[1.5] text-muted">
          Sua avaliação fica pública nesta página assim que enviada.
        </p>
      </div>
    </div>
  );
}
