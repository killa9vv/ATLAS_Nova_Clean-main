'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
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
  const [enviando, setEnviando] = useState(false);

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

  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo || !produto) return;

    setEnviando(true);
    try {
      await enviarImagemProdutoAdmin(produto.id, arquivo);
      invalidar();
      showToast('Imagem enviada.', 'success');
    } catch (erro) {
      showToast(erro instanceof ApiError ? erro.message : 'Erro ao enviar imagem.', 'error');
    } finally {
      setEnviando(false);
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
              <div key={imagem.id} className="relative">
                {/* Vem do Cloudinary (domínio externo) — img simples em vez de next/image,
                    que exigiria configurar remotePatterns pra um domínio dinâmico por conta. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagem.thumbnailUrl}
                  alt=""
                  className="aspect-square w-full rounded-atlas-sm border border-line object-cover"
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
              onChange={aoEscolherArquivo}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={enviando}
              onClick={() => inputRef.current?.click()}
            >
              {enviando ? 'Enviando…' : '+ Enviar imagem'}
            </Button>
            <p className="mt-1.5 text-[11.5px] text-muted">JPEG, PNG ou WEBP, até 5MB.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
