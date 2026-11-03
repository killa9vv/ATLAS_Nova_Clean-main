import type { ReactNode } from 'react';
import { CarrinhoItemImagem } from '@/components/loja/CarrinhoItemImagem';
import { ProdutoGarantias } from '@/components/loja/produto/ProdutoGarantias';
import type { ItemCarrinhoServidor } from '@/lib/carrinho-api';

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface CheckoutResumoProps {
  itens: ItemCarrinhoServidor[];
  subtotal: number;
  descontoAtacado: number;
  desconto: number;
  cupomCodigo?: string;
  /** Texto da linha de frete: valor, "Grátis" ou o motivo de ainda não ter valor. */
  frete: string;
  rotuloTotal: string;
  total: number;
  /** Bloco de cupom, que vive na página porque depende do estado do pagamento. */
  cupom: ReactNode;
}

function Conteudo({
  itens,
  subtotal,
  descontoAtacado,
  desconto,
  cupomCodigo,
  frete,
  rotuloTotal,
  total,
  cupom,
}: CheckoutResumoProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <ul className="flex list-none flex-col gap-2.5 p-0">
        {itens.map((item) => (
          <li key={item.produtoId} className="flex items-center gap-2.5 text-[13px]">
            <CarrinhoItemImagem produtoId={item.produtoId} nome={item.nome} tamanho={44} />
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-semibold leading-snug text-navy">{item.nome}</span>
              <span className="text-[12px] text-muted">Quantidade: {item.quantidade}</span>
            </span>
            <span className="font-mono font-semibold text-navy">
              {formatarMoeda(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-line pt-3.5">{cupom}</div>

      <dl className="m-0 flex flex-col gap-1.5 border-t border-line pt-3.5 text-[13px] text-navy">
        <div className="flex justify-between gap-3">
          <dt>Subtotal</dt>
          <dd className="m-0 font-mono">{formatarMoeda(subtotal)}</dd>
        </div>
        {descontoAtacado > 0 && (
          <div className="flex justify-between gap-3 font-semibold text-[#14753c]">
            <dt>Desconto por atacado</dt>
            <dd className="m-0 font-mono">−{formatarMoeda(descontoAtacado)}</dd>
          </div>
        )}
        {desconto > 0 && (
          <div className="flex justify-between gap-3 font-semibold text-[#14753c]">
            <dt>Desconto{cupomCodigo ? ` (${cupomCodigo})` : ''}</dt>
            <dd className="m-0 font-mono">−{formatarMoeda(desconto)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt>Frete</dt>
          <dd className="m-0 text-right font-mono">{frete}</dd>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-line pt-2.5">
          <dt className="font-display text-[15px] font-bold">{rotuloTotal}</dt>
          <dd key={total} className="estrela-pop m-0 font-mono text-[20px] font-bold">
            {formatarMoeda(total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

// O mesmo conteúdo em duas formas: no celular, recolhido no topo pra não empurrar o formulário
// (com o total sempre à vista); no computador, fixo ao lado em todas as etapas.
export function CheckoutResumo(props: CheckoutResumoProps) {
  return (
    <>
      <details className="group rounded-atlas border border-line bg-white shadow-atlas nav:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-navy">
            Resumo do pedido
            <span
              aria-hidden="true"
              className="text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
            >
              ▾
            </span>
          </span>
          <span className="font-mono text-[15px] font-bold text-navy">
            {formatarMoeda(props.total)}
          </span>
        </summary>
        <div className="border-t border-line p-4">
          <Conteudo {...props} />
        </div>
      </details>

      <div className="hidden rounded-atlas border border-line bg-white p-5 shadow-atlas nav:block">
        <h2 className="mb-3.5 font-display text-[15px] font-bold text-navy">Resumo do pedido</h2>
        <Conteudo {...props} />
        <div className="mt-3.5">
          <ProdutoGarantias />
        </div>
      </div>
    </>
  );
}
