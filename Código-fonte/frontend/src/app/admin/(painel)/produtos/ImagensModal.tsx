'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import { comprimirImagem } from '@/lib/comprimir-imagem';
import {
  definirImagemPrincipalAdmin,
  enviarImagemProdutoAdmin,
  listarImagensProdutoAdmin,
  removerImagemProdutoAdmin,
  type ProdutoAdmin,
} from '@/lib/admin-produtos';

export interface ImagensModalProps {
  produto: ProdutoAdmin | null;
  onClose: () => void;
}

export function ImagensModal({ produto, onClose }: ImagensModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  // null = parado; texto = progresso mostrado no botão.
  const [enviando, setEnviando] = useState<string | null>(null);

  const imagensQuery = useQuery({
    queryKey: ['admin', 'produtos', produto?.id, 'imagens'],
    queryFn: () => listarImagensProdutoAdmin(produto!.id),
    enabled: !!produto,
  });

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'produtos', produto?.id, 'imagens'] });
  }

  const removerMutation = useMutation({
    mutationFn: (imagemId: string) => removerImagemProdutoAdmin(produto!.id, imagemId),
    onSuccess: invalidar,
    onError: (erro) =>
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao remover imagem.', 'error'),
  });

  const principalMutation = useMutation({
    mutationFn: (imagemId: string) => definirImagemPrincipalAdmin(produto!.id, imagemId),
    onSuccess: invalidar,
    onError: (erro) =>
      showToast(
        erro instanceof ApiError ? erro.message : 'Erro ao definir imagem principal.',
        'error',
      ),
  });

  // Aceita várias fotos de uma vez; envia uma por vez (a ordem de escolha vira a
  // ordem da galeria) e segue nas próximas se uma falhar.
  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    evento.target.value = '';
    if (arquivos.length === 0 || !produto) return;

    let enviadas = 0;
    for (const [indice, arquivo] of arquivos.entries()) {
      setEnviando(
        arquivos.length > 1 ? `Enviando ${indice + 1} de ${arquivos.length}…` : 'Enviando…',
      );
      try {
        await enviarImagemProdutoAdmin(produto.id, await comprimirImagem(arquivo));
        enviadas += 1;
        invalidar();
      } catch (erro) {
        showToast(
          `${arquivo.name}: ${erro instanceof ApiError ? erro.message : 'erro ao enviar imagem.'}`,
          'error',
        );
      }
    }
    setEnviando(null);
    if (enviadas > 0) {
      showToast(enviadas === 1 ? 'Imagem enviada.' : `${enviadas} imagens enviadas.`, 'success');
    }
  }

  return (
    <Modal
      open={!!produto}
      onClose={onClose}
      title={
        produto
          ? `Imagens — ${produto.nome}${produto.marca?.nome ? ` (${produto.marca.nome}${produto.pack ? ` · ${produto.pack}` : ''})` : ''}`
          : undefined
      }
    >
      {produto && (
        <div className="flex flex-col gap-4">
          {imagensQuery.isLoading && <p className="text-[13px] text-muted">Carregando…</p>}

          {!imagensQuery.isLoading && (imagensQuery.data?.length ?? 0) === 0 && (
            <p className="text-[13px] text-muted">Nenhuma imagem ainda.</p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {imagensQuery.data?.map((imagem) => (
              <div key={imagem.id} className="relative aspect-square">
                <Image
                  src={imagem.thumbnailUrl}
                  alt=""
                  fill
                  sizes="33vw"
                  className="rounded-atlas-sm border border-line object-cover"
                />
                {imagem.principal && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-green px-2 py-0.5 text-[10px] font-bold text-white">
                    Principal
                  </span>
                )}
                <div className="mt-1.5 flex gap-1">
                  {!imagem.principal && (
                    <button
                      type="button"
                      onClick={() => principalMutation.mutate(imagem.id)}
                      className="flex-1 rounded-atlas-sm bg-sky px-1.5 py-1 text-[11px] font-semibold text-navy hover:bg-blue/20"
                    >
                      Definir principal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removerMutation.mutate(imagem.id)}
                    className="rounded-atlas-sm bg-red-50 px-1.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={aoEscolherArquivo}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!!enviando}
              onClick={() => inputRef.current?.click()}
            >
              {enviando ?? '+ Enviar imagens'}
            </Button>
            <p className="mt-1.5 text-[11.5px] text-muted">
              JPEG, PNG ou WEBP. Pode escolher várias — as fotos são reduzidas automaticamente antes
              do envio.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
