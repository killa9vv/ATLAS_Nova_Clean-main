'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { cotarFrete, type OpcaoFrete } from '@/lib/frete';
import { formatarCep, somenteDigitos } from '@/lib/formatos';
import { ApiError } from '@/lib/http';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface ProdutoFreteProps {
  quantidade: number;
  valorUnitario: number;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// POST /frete/cotacao é real (Melhor Envio/tabela regional, com fallback — ver
// FreteController no backend), não simulado. Botão "Calcular" explícito em vez de
// disparar sozinho a cada dígito, já que aqui (diferente do checkout) é uma consulta
// opcional de curiosidade, não parte de um fluxo que já vai calcular de qualquer jeito.
export function ProdutoFrete({ quantidade, valorUnitario }: ProdutoFreteProps) {
  const [cep, setCep] = useState('');
  const [opcoes, setOpcoes] = useState<OpcaoFrete[] | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      cotarFrete({
        cepDestino: somenteDigitos(cep),
        quantidadeItens: quantidade,
        valorDeclarado: valorUnitario * quantidade,
      }),
    onSuccess: (resultado) => setOpcoes(resultado.opcoes),
  });

  const cepValido = somenteDigitos(cep).length === 8;

  function aoCalcular(evento: React.FormEvent) {
    evento.preventDefault();
    if (!cepValido) return;
    setOpcoes(null);
    mutation.mutate();
  }

  return (
    <div className="rounded-atlas border border-line bg-white p-4">
      <h2 className="mb-2.5 font-display text-sm font-bold text-navy">Calcular frete</h2>
      <form onSubmit={aoCalcular} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="CEP"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(formatarCep(e.target.value))}
            maxLength={9}
            inputMode="numeric"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={!cepValido || mutation.isPending}>
          {mutation.isPending ? 'Calculando…' : 'Calcular'}
        </Button>
      </form>

      {mutation.isError && (
        <p className="mt-3 text-[12.5px] text-red-500">
          {mutation.error instanceof ApiError
            ? mutation.error.message
            : 'Não foi possível calcular o frete agora. Tente de novo.'}
        </p>
      )}

      {opcoes && (
        <ul className="mt-3 flex flex-col gap-2">
          {opcoes.length === 0 && (
            <li className="text-[12.5px] text-muted">Nenhuma opção de frete pra esse CEP.</li>
          )}
          {opcoes.map((opcao) => (
            <li
              key={opcao.tipo}
              className="flex items-center justify-between rounded-atlas-sm border border-line px-3 py-2 text-[13px]"
            >
              <span className="text-navy">
                {opcao.tipo === 'RETIRADA' ? 'Retirada na loja' : 'Entrega'}
                {/* Retirada vem com prazo 0, e "0 dias" não diz nada: depende da loja confirmar. */}
                {opcao.prazoEstimadoDias > 0 && (
                  <span className="ml-1.5 text-muted">
                    · {opcao.prazoEstimadoDias} {opcao.prazoEstimadoDias === 1 ? 'dia' : 'dias'}
                  </span>
                )}
              </span>
              <span className="font-mono font-bold text-navy">
                {opcao.valor === 0 ? 'Grátis' : formatarMoeda(opcao.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
