'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CarrinhoItemImagem } from '@/components/loja/CarrinhoItemImagem';
import { NeilAstronauta } from '@/components/loja/NeilAstronauta';
import { useToast } from '@/components/ui/Toast';
import {
  buscarStatusAtendimento,
  conversarComAtendimento,
  type MensagemParaAtendimento,
  type ProdutoDoChat,
} from '@/lib/atendimento';
import { useCart } from '@/lib/cart-context';
import { ApiError } from '@/lib/http';
import { hrefWhatsApp } from '@/lib/whatsapp';

const CHAVE_CONVERSA = 'atlas_atendimento_conversa';
const TAMANHO_MAXIMO_MENSAGEM = 1000;
const TAMANHO_MAXIMO_NO_HISTORICO = 4000;
const MENSAGENS_NO_HISTORICO = 30;
const DISTANCIA_PARA_COLAR_NO_FIM_PX = 80;

const SUGESTOES = [
  {
    texto: 'Quero encontrar um produto',
    icone: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  },
  {
    texto: 'Qual o horário e o endereço?',
    icone: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  },
  { texto: 'Onde está meu pedido?', icone: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8' },
  {
    texto: 'Quero falar com uma pessoa',
    icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  },
];

const CLASSES_BALAO_NEIL =
  'w-fit max-w-full whitespace-pre-line break-words rounded-[4px_16px_16px_16px] border border-line bg-white px-3.5 py-2.5 text-[13.5px] text-navy';

const MENSAGEM_ERRO =
  'Não consegui responder agora. Tente de novo em instantes ou fale com a loja pelo WhatsApp.';
const MENSAGEM_MUITAS_MENSAGENS =
  'Muitas mensagens em pouco tempo. Espere um minutinho e tente de novo.';

interface MensagemChat {
  id: string;
  papel: 'cliente' | 'assistente';
  texto: string;
  produtos?: ProdutoDoChat[];
  whatsapp?: string;
  /** Falha de transporte: aparece na tela, mas não volta pro modelo como se ele tivesse dito. */
  falhou?: boolean;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function novoId(): string {
  return Math.random().toString(36).slice(2);
}

function lerConversaSalva(): MensagemChat[] {
  try {
    const bruto = sessionStorage.getItem(CHAVE_CONVERSA);
    return bruto ? (JSON.parse(bruto) as MensagemChat[]) : [];
  } catch {
    return [];
  }
}

function salvarConversa(mensagens: MensagemChat[]): void {
  try {
    sessionStorage.setItem(CHAVE_CONVERSA, JSON.stringify(mensagens));
  } catch {
    // Sem armazenamento (janela privada, por exemplo), a conversa só não sobrevive à navegação.
  }
}

// O modelo só recebe texto: sem citar os cartões, ele não saberia o que "esse segundo" quer dizer.
function paraHistorico(mensagens: MensagemChat[]): MensagemParaAtendimento[] {
  return mensagens
    .filter((mensagem) => !mensagem.falhou)
    .map((mensagem) => {
      const cartoes = mensagem.produtos?.map((produto) => produto.nome).join('; ');
      const texto = cartoes
        ? `${mensagem.texto}\n(Cartões mostrados ao cliente: ${cartoes})`.trim()
        : mensagem.texto.trim();
      return { papel: mensagem.papel, texto: texto.slice(0, TAMANHO_MAXIMO_NO_HISTORICO) };
    })
    .filter((mensagem) => mensagem.texto.length > 0)
    .slice(-MENSAGENS_NO_HISTORICO);
}

function CartaoProduto({ produto }: { produto: ProdutoDoChat }) {
  const { adicionar } = useCart();
  const { showToast } = useToast();
  const [estado, setEstado] = useState<'parado' | 'adicionando' | 'adicionado'>('parado');
  const preco = produto.precoPromocional ?? produto.preco;
  const detalhes = [produto.marca, produto.pack].filter(Boolean).join(' · ');

  async function aoAdicionar() {
    setEstado('adicionando');
    try {
      await adicionar(produto.id);
      setEstado('adicionado');
    } catch (erro) {
      setEstado('parado');
      showToast(
        erro instanceof ApiError
          ? erro.message
          : 'Não foi possível adicionar agora. Tente de novo.',
        'error',
      );
    }
  }

  return (
    <li className="flex items-center gap-2.5 rounded-atlas-sm border border-line bg-white p-2">
      <CarrinhoItemImagem produtoId={produto.id} nome={produto.nome} tamanho={44} />
      <div className="min-w-0 flex-1">
        {produto.href ? (
          <Link
            href={produto.href}
            className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-navy hover:underline"
          >
            {produto.nome}
          </Link>
        ) : (
          <p className="line-clamp-2 text-[12.5px] font-semibold leading-tight text-navy">
            {produto.nome}
          </p>
        )}
        {detalhes && <p className="truncate text-[11.5px] text-muted">{detalhes}</p>}
        <p className="font-mono text-[12.5px] font-semibold text-navy">
          {formatarMoeda(preco)}
          {produto.precoPromocional !== undefined && (
            <s className="ml-1.5 text-[11px] font-normal text-muted">
              {formatarMoeda(produto.preco)}
            </s>
          )}
        </p>
      </div>
      {produto.disponivel ? (
        <button
          type="button"
          onClick={aoAdicionar}
          disabled={estado !== 'parado'}
          aria-label={`Adicionar ${produto.nome} ao carrinho`}
          className="h-9 shrink-0 rounded-atlas-sm border border-navy px-2.5 text-[12px] font-bold text-navy transition-[background-color,scale] hover:bg-sky active:scale-95 disabled:cursor-default disabled:border-line disabled:bg-sky motion-reduce:transition-none"
        >
          {estado === 'parado' ? 'Adicionar' : estado === 'adicionando' ? '...' : 'Adicionado'}
        </button>
      ) : (
        <span className="shrink-0 text-[11.5px] font-semibold text-muted">Sem estoque</span>
      )}
    </li>
  );
}

function AvatarNeil({ tamanho }: { tamanho: number }) {
  return (
    <span
      style={{ width: tamanho, height: tamanho }}
      className="ceu-estrelado relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20"
    >
      <NeilAstronauta variante="cabeca" tamanho={tamanho - 4} />
    </span>
  );
}

function LinhaNeil({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <AvatarNeil tamanho={28} />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 *:max-w-full [&>ul]:w-full">
        {children}
      </div>
    </div>
  );
}

function BalaoConsultando() {
  return (
    <LinhaNeil>
      <div
        role="status"
        className="flex w-fit items-center gap-2 rounded-[4px_16px_16px_16px] border border-line bg-white px-3.5 py-2.5 text-[12.5px] text-muted"
      >
        <span aria-hidden="true" className="flex gap-1">
          {[0, 150, 300].map((atraso) => (
            <span
              key={atraso}
              style={{ animationDelay: `${atraso}ms` }}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue motion-reduce:animate-none"
            />
          ))}
        </span>
        Consultando a base...
      </div>
    </LinhaNeil>
  );
}

// Fica ao lado do botão do WhatsApp. No celular vai acima dele, porque ao lado cobriria o
// "Comprar" da barra fixa da página de produto, e some com a janela aberta, que ocuparia o lugar.
// Sem chave da IA configurada no servidor, nem aparece.
export function AtendimentoChat() {
  const { data: status } = useQuery({
    queryKey: ['atendimento-status'],
    queryFn: buscarStatusAtendimento,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const [aberto, setAberto] = useState(false);
  // Ler aqui não quebra a hidratação: no servidor dá vazio, e as mensagens só são desenhadas
  // com a janela aberta, o que nunca é o caso no primeiro render.
  const [mensagens, setMensagens] = useState<MensagemChat[]>(lerConversaSalva);
  const [rascunho, setRascunho] = useState('');
  const [respondendo, setRespondendo] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const coladoNoFimRef = useRef(true);
  const cancelamentoRef = useRef<AbortController | null>(null);
  const tituloId = useId();

  useEffect(() => () => cancelamentoRef.current?.abort(), []);

  useEffect(() => {
    if (!respondendo) salvarConversa(mensagens);
  }, [mensagens, respondendo]);

  useEffect(() => {
    const area = areaRef.current;
    if (area && coladoNoFimRef.current) area.scrollTop = area.scrollHeight;
  }, [mensagens, respondendo, aberto]);

  useEffect(() => {
    if (!aberto) return;
    // No celular, focar abriria o teclado por cima das sugestões antes de a pessoa pedir.
    if (window.matchMedia('(pointer: fine)').matches) campoRef.current?.focus();
    const botao = botaoRef.current;
    function aoApertarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false);
    }
    document.addEventListener('keydown', aoApertarTecla);
    return () => {
      document.removeEventListener('keydown', aoApertarTecla);
      // Aqui, e não ao clicar em fechar: no celular o botão só volta a existir depois do render.
      botao?.focus();
    };
  }, [aberto]);

  if (!status?.ativo) return null;

  function atualizarResposta(id: string, mudanca: (mensagem: MensagemChat) => MensagemChat) {
    setMensagens((atuais) =>
      atuais.map((mensagem) => (mensagem.id === id ? mudanca(mensagem) : mensagem)),
    );
  }

  async function enviar(texto: string) {
    const conteudo = texto.trim();
    if (!conteudo || respondendo) return;

    const pergunta: MensagemChat = { id: novoId(), papel: 'cliente', texto: conteudo };
    const resposta: MensagemChat = { id: novoId(), papel: 'assistente', texto: '' };
    const historico = paraHistorico([...mensagens, pergunta]);
    setMensagens((atuais) => [...atuais, pergunta, resposta]);
    setRascunho('');
    setRespondendo(true);
    coladoNoFimRef.current = true;

    const cancelamento = new AbortController();
    cancelamentoRef.current = cancelamento;
    const mostrarFalha = (aviso: string) =>
      atualizarResposta(resposta.id, (atual) => ({ ...atual, texto: aviso, falhou: true }));

    try {
      await conversarComAtendimento(
        historico,
        (evento) => {
          if (evento.tipo === 'texto') {
            atualizarResposta(resposta.id, (atual) => ({
              ...atual,
              texto: atual.texto + evento.texto,
            }));
          } else if (evento.tipo === 'produtos') {
            atualizarResposta(resposta.id, (atual) => ({
              ...atual,
              produtos: [...(atual.produtos ?? []), ...evento.itens],
            }));
          } else if (evento.tipo === 'whatsapp') {
            atualizarResposta(resposta.id, (atual) => ({ ...atual, whatsapp: evento.mensagem }));
          } else if (evento.tipo === 'erro') {
            mostrarFalha(evento.mensagem);
          }
        },
        cancelamento.signal,
      );
    } catch (erro) {
      if (!cancelamento.signal.aborted) {
        mostrarFalha(
          erro instanceof ApiError && erro.status === 429
            ? MENSAGEM_MUITAS_MENSAGENS
            : MENSAGEM_ERRO,
        );
      }
    } finally {
      if (cancelamentoRef.current === cancelamento) {
        cancelamentoRef.current = null;
        setRespondendo(false);
      }
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    void enviar(rascunho);
  }

  function novaConversa() {
    cancelamentoRef.current?.abort();
    cancelamentoRef.current = null;
    setRespondendo(false);
    setMensagens([]);
    setRascunho('');
  }

  const ultima = mensagens[mensagens.length - 1];
  const aguardandoInicio =
    respondendo && !!ultima && !ultima.texto && !ultima.produtos && !ultima.whatsapp;
  const conversaVazia = mensagens.length === 0;

  return (
    <>
      {aberto && (
        <section
          role="dialog"
          aria-labelledby={tituloId}
          className="fixed inset-x-3 bottom-3 z-[210] flex h-[min(640px,calc(100dvh-24px))] animate-card-in flex-col overflow-hidden rounded-[20px] border border-navy/10 bg-white shadow-atlas-lg motion-reduce:animate-none nav:inset-x-auto nav:bottom-24 nav:right-5 nav:h-[600px] nav:max-h-[calc(100dvh-120px)] nav:w-[392px]"
        >
          <header className="relative flex shrink-0 items-center gap-2.5 overflow-hidden bg-navy px-3.5 py-3 text-white">
            <span
              aria-hidden="true"
              className="absolute -right-7 -top-11 h-24 w-24 rounded-full bg-gradient-to-br from-blue to-navy-2 opacity-70"
            />
            <AvatarNeil tamanho={40} />
            <div className="relative min-w-0 flex-1">
              <h2
                id={tituloId}
                className="truncate font-display text-[15.5px] font-bold leading-tight"
              >
                Neil
              </h2>
              <p className="truncate text-[11.5px] text-sky/80">O astronauta da Atlas · IA</p>
            </div>
            {!conversaVazia && (
              <button
                type="button"
                onClick={novaConversa}
                aria-label="Nova conversa"
                title="Nova conversa"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar chat"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/15"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div
            ref={areaRef}
            role="log"
            aria-live="polite"
            onScroll={(evento) => {
              const area = evento.currentTarget;
              coladoNoFimRef.current =
                area.scrollHeight - area.scrollTop - area.clientHeight <
                DISTANCIA_PARA_COLAR_NO_FIM_PX;
            }}
            className="flex flex-1 flex-col overflow-y-auto overscroll-contain bg-paper"
          >
            {conversaVazia ? (
              <>
                <div className="relative shrink-0 bg-navy px-5 pb-8 pt-1 text-center text-white">
                  <span
                    aria-hidden="true"
                    className="ceu-estrelado absolute inset-0 [mask-image:linear-gradient(black_40%,transparent_58%)]"
                  />
                  <NeilAstronauta tamanho={74} className="neil-flutuar relative mx-auto" />
                  <p className="relative mt-2 font-display text-[17px] font-bold">
                    Olá! Eu sou o Neil.
                  </p>
                  <p className="relative mx-auto mt-0.5 max-w-[270px] text-[12.5px] leading-snug text-sky/85">
                    Um pequeno passo pra sua lista, um grande salto pra sua limpeza.
                  </p>
                </div>
                <div className="relative -mt-4 flex flex-1 flex-col gap-2 rounded-t-[20px] bg-paper p-3.5">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-blue">
                    Como posso ajudar?
                  </p>
                  <ul className="flex list-none flex-col gap-1.5 p-0">
                    {SUGESTOES.map(({ texto, icone }) => (
                      <li key={texto}>
                        <button
                          type="button"
                          onClick={() => void enviar(texto)}
                          className="flex min-h-10 w-full items-center gap-2.5 rounded-atlas-sm border border-line bg-white px-2.5 py-1.5 text-left text-[13px] font-semibold text-navy transition-[background-color,translate] hover:-translate-y-px hover:bg-sky motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                        >
                          <svg
                            aria-hidden="true"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0 text-blue"
                          >
                            <path d={icone} />
                          </svg>
                          {texto}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-1.5 text-[11px] leading-snug text-muted">
                    Respostas geradas por IA podem conter erros: o preço que vale é o do carrinho.
                    Não informe senhas ou dados de cartão. Veja a{' '}
                    <Link href="/politica-privacidade" className="underline">
                      Política de Privacidade
                    </Link>
                    .
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 p-3.5">
                <LinhaNeil>
                  <div className={CLASSES_BALAO_NEIL}>
                    Olá! Eu sou o Neil. Posso encontrar produtos, tirar dúvidas e ver seus pedidos.
                  </div>
                </LinhaNeil>

                {mensagens.map((mensagem) => {
                  if (mensagem.papel === 'cliente') {
                    return (
                      <div
                        key={mensagem.id}
                        className="ml-auto w-fit max-w-[85%] whitespace-pre-line break-words rounded-[16px_4px_16px_16px] bg-navy px-3.5 py-2.5 text-[13.5px] text-white"
                      >
                        {mensagem.texto}
                      </div>
                    );
                  }
                  // A resposta nasce vazia: até chegar algo, quem aparece é o "consultando".
                  if (
                    !mensagem.texto &&
                    !mensagem.produtos &&
                    !mensagem.whatsapp &&
                    !mensagem.falhou
                  ) {
                    return null;
                  }
                  return (
                    <LinhaNeil key={mensagem.id}>
                      {mensagem.produtos && (
                        <ul className="flex list-none flex-col gap-1.5 p-0">
                          {mensagem.produtos.map((produto) => (
                            <CartaoProduto key={produto.id} produto={produto} />
                          ))}
                        </ul>
                      )}
                      {mensagem.texto && <div className={CLASSES_BALAO_NEIL}>{mensagem.texto}</div>}
                      {(mensagem.whatsapp || mensagem.falhou) && (
                        <a
                          href={hrefWhatsApp(mensagem.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-10 w-fit items-center rounded-full bg-[#14753c] px-4 text-[13px] font-bold text-white transition-[filter] hover:brightness-110 motion-reduce:transition-none"
                        >
                          Continuar no WhatsApp
                        </a>
                      )}
                    </LinhaNeil>
                  );
                })}

                {aguardandoInicio && <BalaoConsultando />}
              </div>
            )}
          </div>

          <form onSubmit={aoEnviar} className="shrink-0 border-t border-line bg-white p-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-paper py-1 pl-4 pr-1 transition-colors focus-within:border-navy focus-within:bg-white motion-reduce:transition-none">
              <input
                ref={campoRef}
                value={rascunho}
                onChange={(evento) => setRascunho(evento.target.value)}
                maxLength={TAMANHO_MAXIMO_MENSAGEM}
                aria-label="Sua mensagem"
                placeholder="Fale com o Neil"
                autoComplete="off"
                // 16px no celular: abaixo disso, o iOS dá zoom na página ao focar o campo.
                className="min-w-0 flex-1 bg-transparent py-1 text-[16px] text-navy outline-none placeholder:text-muted nav:text-[13.5px]"
              />
              <button
                type="submit"
                disabled={respondendo || !rascunho.trim()}
                aria-label="Enviar mensagem"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-[opacity,scale] active:scale-90 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
              >
                <svg
                  aria-hidden="true"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2zM9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        aria-label={aberto ? 'Fechar chat com o Neil' : 'Abrir chat com o Neil'}
        className={`ceu-estrelado group fixed bottom-[88px] right-5 z-[200] h-14 w-14 items-center justify-center rounded-full text-white shadow-atlas-lg transition-[scale] hover:scale-105 active:scale-95 motion-reduce:transition-none nav:bottom-5 nav:right-[88px] nav:flex ${aberto ? 'hidden' : 'flex'}`}
      >
        {aberto ? (
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <>
            <NeilAstronauta variante="cabeca" tamanho={42} />
            <span aria-hidden="true" className="neil-orbita absolute -inset-[5px]">
              <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#f5a623]" />
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-[12.5px] font-semibold opacity-0 shadow-atlas transition-opacity group-hover:opacity-100 motion-reduce:transition-none nav:block"
            >
              Fale com o Neil
            </span>
          </>
        )}
      </button>
    </>
  );
}
