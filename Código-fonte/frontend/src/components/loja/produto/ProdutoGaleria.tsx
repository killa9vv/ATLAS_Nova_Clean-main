'use client';

import { useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { listarImagensProduto } from '@/lib/produtos';
import { corDaCategoria } from '@/lib/categoria-visual';
import { Modal } from '@/components/ui/Modal';

export interface ProdutoGaleriaProps {
  produtoId: string;
  nome: string;
  categoria?: string;
  marcaImagemUrl?: string;
  marcaNome?: string;
}

const ESCALA_ZOOM = 2;

// Sem imagem cadastrada é caso esperado (Upload de imagens é um card à parte, ainda
// em desenvolvimento) — cai pro logo da marca, e por último um ícone genérico. Nunca
// trata a ausência de foto como estado de erro.
export function ProdutoGaleria({
  produtoId,
  nome,
  categoria,
  marcaImagemUrl,
  marcaNome,
}: ProdutoGaleriaProps) {
  const [indiceSelecionado, setIndiceSelecionado] = useState(0);
  const [zoomAtivo, setZoomAtivo] = useState(false);
  const [posicaoZoom, setPosicaoZoom] = useState({ x: 50, y: 50 });
  const [expandidoAberto, setExpandidoAberto] = useState(false);

  const { data: imagens } = useQuery({
    queryKey: ['produto-imagens', produtoId],
    queryFn: ({ signal }) => listarImagensProduto(produtoId, { signal }),
    staleTime: 5 * 60_000,
  });

  const lista = imagens ?? [];
  const imagemAtiva = lista[indiceSelecionado] ?? lista[0];
  const corFundo = corDaCategoria(categoria);

  function aoMoverMouse(evento: MouseEvent<HTMLDivElement>) {
    const retangulo = evento.currentTarget.getBoundingClientRect();
    const x = ((evento.clientX - retangulo.left) / retangulo.width) * 100;
    const y = ((evento.clientY - retangulo.top) / retangulo.height) * 100;
    setPosicaoZoom({ x, y });
  }

  const semFoto = lista.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-atlas border border-line"
        style={{ background: corFundo }}
        onMouseEnter={() => !semFoto && setZoomAtivo(true)}
        onMouseLeave={() => setZoomAtivo(false)}
        onMouseMove={aoMoverMouse}
      >
        {imagemAtiva ? (
          <>
            {/* Botão invisível cobrindo a imagem — tap-to-expand no mobile. No desktop o
                zoom já acontece por hover, então o clique também abre o modal (não atrapalha:
                é raro alguém clicar sem querer numa imagem grande). */}
            <button
              type="button"
              onClick={() => setExpandidoAberto(true)}
              aria-label={`Ampliar imagem de ${nome}`}
              className="absolute inset-0 z-10 cursor-zoom-in nav:cursor-default"
            />
            <Image
              src={imagemAtiva.url}
              alt={nome}
              fill
              sizes="(min-width: 861px) 50vw, 100vw"
              className="object-contain p-6 transition-transform duration-150 nav:duration-100"
              style={
                zoomAtivo
                  ? {
                      transform: `scale(${ESCALA_ZOOM})`,
                      transformOrigin: `${posicaoZoom.x}% ${posicaoZoom.y}%`,
                    }
                  : undefined
              }
              priority
            />
          </>
        ) : marcaImagemUrl ? (
          <Image
            src={marcaImagemUrl}
            alt={marcaNome ?? nome}
            width={200}
            height={96}
            className="h-24 w-auto object-contain p-10 opacity-70"
          />
        ) : (
          <span className="p-10 text-6xl opacity-60" aria-hidden="true">
            🧴
          </span>
        )}
      </div>

      {lista.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {lista.map((imagem, indice) => (
            <button
              key={imagem.id}
              type="button"
              onClick={() => setIndiceSelecionado(indice)}
              aria-label={`Ver imagem ${indice + 1} de ${lista.length}`}
              aria-current={indice === indiceSelecionado}
              className={[
                'relative h-16 w-16 shrink-0 overflow-hidden rounded-atlas-sm border-2 bg-white',
                indice === indiceSelecionado ? 'border-blue' : 'border-line hover:border-muted',
              ].join(' ')}
            >
              <Image
                src={imagem.thumbnailUrl}
                alt=""
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {imagemAtiva && (
        <Modal open={expandidoAberto} onClose={() => setExpandidoAberto(false)} title={nome}>
          <div className="relative aspect-square w-full">
            <Image src={imagemAtiva.url} alt={nome} fill sizes="90vw" className="object-contain" />
          </div>
        </Modal>
      )}
    </div>
  );
}
