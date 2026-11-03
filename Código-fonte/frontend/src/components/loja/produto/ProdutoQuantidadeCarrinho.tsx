'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import { Stepper } from '@/components/ui/Stepper';
import { CLASSES_BOTAO_COMPRAR as CLASSES_COMPRAR } from '@/components/ui/botao-comprar';
import { hrefWhatsApp } from '@/lib/whatsapp';

// Aviso de estoque baixo só com o número real: nada de urgência inventada.
const LIMITE_ESTOQUE_BAIXO = 5;

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface ProdutoQuantidadeCarrinhoProps {
  produtoId: string;
  nome: string;
  /** Marca e embalagem, pra mensagem do WhatsApp sair com o produto certo. */
  detalhes?: string;
  precoUnitario: number;
  estoque: number;
  /** Controlado pelo pai — a mesma quantidade alimenta o calculador de frete
   * (ProdutoFrete), então não pode ser estado só interno deste componente. */
  quantidade: number;
  aoMudarQuantidade: (quantidade: number) => void;
}

// O decremento de estoque no backend já é atômico e testado sob concorrência (card
// "Controle de estoque" concluído) — `estoque <= 0` aqui é um dado confiável, não um
// palpite. Mesmo assim, entre o carregamento desta página e o clique em "adicionar"
// alguém mais pode ter levado o último item; o catch abaixo cobre exatamente esse
// caso (a API recusa e devolve mensagem clara, em vez de falha silenciosa).
export function ProdutoQuantidadeCarrinho({
  produtoId,
  nome,
  detalhes,
  precoUnitario,
  estoque,
  quantidade,
  aoMudarQuantidade,
}: ProdutoQuantidadeCarrinhoProps) {
  const router = useRouter();
  const { itens, adicionar, atualizarQuantidade, abrirDrawer } = useCart();
  const { showToast } = useToast();
  const [enviando, setEnviando] = useState(false);
  const [indoAoCheckout, setIndoAoCheckout] = useState(false);
  const [blocoVisivel, setBlocoVisivel] = useState(true);
  const blocoRef = useRef<HTMLDivElement>(null);

  const noCarrinho = itens.find((item) => item.produtoId === produtoId);
  const semEstoque = estoque <= 0;
  const quantidadeNaMensagem = noCarrinho?.quantidade ?? quantidade;
  const hrefPedido = hrefWhatsApp(
    `Olá! Quero pedir: ${quantidadeNaMensagem}x ${nome}${detalhes ? ` (${detalhes})` : ''}`,
  );

  // A barra fixa do celular só aparece quando os botões principais estão fora da tela.
  useEffect(() => {
    const bloco = blocoRef.current;
    if (!bloco) return;
    const observador = new IntersectionObserver(([registro]) =>
      setBlocoVisivel(registro.isIntersecting),
    );
    observador.observe(bloco);
    return () => observador.disconnect();
  }, []);

  async function adicionarAoCarrinho(): Promise<boolean> {
    setEnviando(true);
    try {
      await adicionar(produtoId, quantidade);
      return true;
    } catch (erro) {
      showToast(
        erro instanceof ApiError
          ? erro.message
          : 'Não foi possível adicionar ao carrinho agora. Tente de novo.',
        'error',
      );
      return false;
    } finally {
      setEnviando(false);
    }
  }

  async function aoAdicionar() {
    if (!(await adicionarAoCarrinho())) return;
    showToast(
      quantidade > 1
        ? `${quantidade} unidades adicionadas ao carrinho.`
        : 'Adicionado ao carrinho.',
      'success',
    );
    aoMudarQuantidade(1);
  }

  async function aoComprarAgora() {
    setIndoAoCheckout(true);
    if (await adicionarAoCarrinho()) {
      router.push('/checkout');
    } else {
      setIndoAoCheckout(false);
    }
  }

  const textoComprar = indoAoCheckout ? 'Indo para o pagamento…' : 'Comprar agora';
  const ocupado = enviando || indoAoCheckout;

  return (
    <>
      <div ref={blocoRef} className="flex flex-col gap-3">
        {semEstoque ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-atlas-sm bg-line px-5 py-3 text-[14px] font-semibold text-muted"
          >
            Indisponível
          </button>
        ) : noCarrinho ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-muted">Já no carrinho:</span>
              <Stepper
                quantidade={noCarrinho.quantidade}
                onChange={(q) => atualizarQuantidade(produtoId, q)}
              />
            </div>
            <Link href="/checkout" className={`${CLASSES_COMPRAR} mb-1 px-5 py-3.5`}>
              Finalizar compra →
            </Link>
            <button
              type="button"
              onClick={abrirDrawer}
              className="rounded-atlas-sm border border-navy px-5 py-2.5 text-[14px] font-semibold text-navy transition-colors hover:bg-sky motion-reduce:transition-none"
            >
              Ver carrinho
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="inline-flex items-center gap-2.5 rounded-atlas-sm border border-line bg-white px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => aoMudarQuantidade(Math.max(1, quantidade - 1))}
                  disabled={quantidade <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-atlas-sm text-navy hover:bg-sky disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={estoque}
                  value={quantidade}
                  onChange={(e) => {
                    const valor = Number(e.target.value);
                    if (Number.isFinite(valor)) {
                      aoMudarQuantidade(Math.min(Math.max(1, valor), estoque));
                    }
                  }}
                  className="w-10 border-0 bg-transparent text-center text-[14px] font-semibold text-ink focus:outline-none"
                  aria-label="Quantidade"
                />
                <button
                  type="button"
                  onClick={() => aoMudarQuantidade(Math.min(estoque, quantidade + 1))}
                  disabled={quantidade >= estoque}
                  className="flex h-8 w-8 items-center justify-center rounded-atlas-sm text-navy hover:bg-sky disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
              <div className="text-right">
                {quantidade > 1 && (
                  <p className="text-[13px] text-muted">
                    Total:{' '}
                    <span key={quantidade} className="estrela-pop font-mono font-bold text-navy">
                      {formatarMoeda(precoUnitario * quantidade)}
                    </span>
                  </p>
                )}
                {estoque <= LIMITE_ESTOQUE_BAIXO ? (
                  <p className="text-[12.5px] font-semibold text-[#9a5b00]">
                    {estoque === 1 ? 'Última unidade em estoque' : `Últimas ${estoque} unidades`}
                  </p>
                ) : (
                  <p className="flex items-center justify-end gap-1.5 text-[12.5px] font-semibold text-[#14753c]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#14753c]" aria-hidden="true" />
                    Em estoque
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={aoComprarAgora}
              disabled={ocupado}
              className={`${CLASSES_COMPRAR} mb-1 px-5 py-3.5`}
            >
              {textoComprar}
            </button>
            <button
              type="button"
              onClick={aoAdicionar}
              disabled={ocupado}
              className="rounded-atlas-sm border border-navy px-5 py-2.5 text-[14px] font-semibold text-navy transition-[background-color,scale] hover:bg-sky active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            >
              {enviando && !indoAoCheckout ? 'Adicionando…' : '+ Adicionar ao carrinho'}
            </button>
          </>
        )}

        <a
          href={hrefPedido}
          target="_blank"
          rel="noopener noreferrer"
          className="group self-center py-1 text-[13px] font-semibold text-navy hover:underline"
        >
          {semEstoque ? 'Perguntar pelo WhatsApp' : 'Prefere pedir pelo WhatsApp?'}{' '}
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
          >
            →
          </span>
        </a>
      </div>

      {/* Só no celular, onde a galeria empurra os botões pra baixo. pr-20: o botão flutuante do
          WhatsApp fica nesse canto e não pode cobrir o de comprar. */}
      {!blocoVisivel && !semEstoque && (
        <div className="bolha-chega fixed inset-x-0 bottom-0 z-[190] flex items-center gap-3 border-t border-line bg-white py-2.5 pl-4 pr-20 shadow-atlas-lg nav:hidden">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] text-muted">{nome}</span>
            <span className="font-mono text-[15px] font-bold text-navy">
              {formatarMoeda(precoUnitario)}
            </span>
          </span>
          {noCarrinho ? (
            <Link href="/checkout" className={`${CLASSES_COMPRAR} mb-1 shrink-0 px-4 py-2.5`}>
              Finalizar
            </Link>
          ) : (
            <button
              type="button"
              onClick={aoComprarAgora}
              disabled={ocupado}
              className={`${CLASSES_COMPRAR} mb-1 shrink-0 px-4 py-2.5`}
            >
              {indoAoCheckout ? 'Indo…' : 'Comprar'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
