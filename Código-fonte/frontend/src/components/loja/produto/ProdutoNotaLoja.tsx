'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listarResenhas } from '@/lib/resenhas';

const MINIMO_AVALIACOES = 3;
const NOTA_MINIMA_PARA_DESTACAR = 4;

// A avaliação é da loja, não do produto (o schema não tem nota por produto), e o texto deixa
// isso claro. Com poucas avaliações ou média baixa, simplesmente não aparece aqui: o mural
// completo, com todas as notas, continua na home, e é pra onde este link leva.
export function ProdutoNotaLoja() {
  const { data: resenhas } = useQuery({
    queryKey: ['resenhas-loja'],
    queryFn: () => listarResenhas(),
    staleTime: 5 * 60_000,
  });

  if (!resenhas || resenhas.length < MINIMO_AVALIACOES) return null;

  const media = resenhas.reduce((soma, resenha) => soma + resenha.nota, 0) / resenhas.length;
  if (media < NOTA_MINIMA_PARA_DESTACAR) return null;

  return (
    <Link
      href="/#avaliacoes"
      className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:underline"
    >
      <span aria-hidden="true" className="text-amber">
        ★
      </span>
      <span className="font-semibold text-navy">
        {media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      {resenhas.length} avaliações da loja
    </Link>
  );
}
