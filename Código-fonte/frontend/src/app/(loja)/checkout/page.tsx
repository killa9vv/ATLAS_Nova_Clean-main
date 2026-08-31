'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Radio } from '@/components/ui/Radio';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/http';
import { useCart } from '@/lib/cart-context';
import { calcularCarrinho, chaveCarrinho } from '@/lib/carrinho';
import { buscarEnderecoPorCep, criarCliente } from '@/lib/clientes';
import { cotarFrete } from '@/lib/frete';
import { criarPedido, type PedidoCriado } from '@/lib/pedidos';
import { montarLinkWhatsApp } from '@/lib/whatsapp';
import {
  acompanharPagamentoPix,
  desmontarPaymentBrick,
  enviarPagamentoDoBrick,
  renderizarPaymentBrick,
  type PaymentBrickFormData,
} from '@/lib/mercadopago';

const WHATSAPP_NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '';

type ResultadoPagamento =
  | {
      tipo: 'pix';
      qrCode?: string;
      qrCodeBase64?: string;
      status: 'aguardando' | 'timeout' | 'cancelado';
    }
  | { tipo: 'sucesso' }
  | { tipo: 'erro'; mensagem: string };

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

interface CheckoutForm {
  nome: string;
  email: string;
  telefone: string;
  salvarDados: boolean;
  tipoEntrega: 'ENTREGA' | 'RETIRADA';
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const FORM_INICIAL: CheckoutForm = {
  nome: '',
  email: '',
  telefone: '',
  salvarDados: false,
  tipoEntrega: 'ENTREGA',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

const PASSOS = ['Identificação', 'Entrega', 'Revisão'];

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { itens, hidratado, limpar } = useCart();
  const [passo, setPasso] = useState(0);
  const [form, setForm] = useState<CheckoutForm>(FORM_INICIAL);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [metodoFechamento, setMetodoFechamento] = useState<'whatsapp' | 'pagar'>('whatsapp');
  const [sdkPronto, setSdkPronto] = useState(false);
  const [pedidoPagamento, setPedidoPagamento] = useState<PedidoCriado | null>(null);
  const [carregandoPagamento, setCarregandoPagamento] = useState(false);
  const [resultadoPagamento, setResultadoPagamento] = useState<ResultadoPagamento | null>(null);
  const pararPollingRef = useRef<(() => void) | null>(null);

  const carrinhoQuery = useQuery({
    queryKey: ['carrinho-calculo', chaveCarrinho(itens)],
    queryFn: () => calcularCarrinho(itens),
    enabled: itens.length > 0,
  });

  const cepLimpo = somenteDigitos(form.cep);
  const freteQuery = useQuery({
    queryKey: ['frete-cotacao', cepLimpo, carrinhoQuery.data?.total],
    queryFn: () =>
      cotarFrete({
        cepDestino: cepLimpo,
        quantidadeItens: itens.reduce((soma, item) => soma + item.quantidade, 0),
        valorDeclarado: carrinhoQuery.data!.total,
      }),
    enabled:
      form.tipoEntrega === 'ENTREGA' && cepLimpo.length === 8 && !!carrinhoQuery.data && !erroCep,
  });

  // Carrinho vazio não tem o que revisar — manda de volta pro catálogo em vez de
  // deixar o wizard num estado sem sentido. Só decide isso depois de `hidratado`:
  // logo após montar, o carrinho começa vazio até terminar de ler o localStorage
  // (ver CartProvider) — sem esperar, um acesso direto/reload de /checkout com
  // carrinho não vazio seria expulso por engano antes da hidratação terminar.
  useEffect(() => {
    if (hidratado && itens.length === 0) {
      router.replace('/catalogo');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidratado, itens.length]);

  // Desmonta o Brick e para o polling do Pix ao sair da página — evita Brick
  // fantasma sobrepondo outra tela, ou polling rodando sem ninguém olhando.
  useEffect(() => {
    return () => {
      pararPollingRef.current?.();
      desmontarPaymentBrick();
    };
  }, []);

  if (!hidratado || itens.length === 0) {
    return null;
  }

  async function aoSairDoCep() {
    setErroCep(null);
    if (cepLimpo.length !== 8) return;
    try {
      const endereco = await buscarEnderecoPorCep(cepLimpo);
      setForm((prev) => ({
        ...prev,
        logradouro: endereco.logradouro,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
      }));
    } catch (erro) {
      setErroCep(
        erro instanceof ApiError
          ? `${erro.message} Preencha o endereço manualmente.`
          : 'Não conseguimos buscar esse CEP. Preencha o endereço manualmente.',
      );
    }
  }

  function podeAvancarPasso0() {
    return form.nome.trim().length > 0;
  }

  function podeAvancarPasso1() {
    if (form.tipoEntrega === 'RETIRADA') return true;
    return (
      cepLimpo.length === 8 &&
      form.logradouro.trim().length > 0 &&
      form.numero.trim().length > 0 &&
      form.bairro.trim().length > 0 &&
      form.cidade.trim().length > 0 &&
      form.estado.trim().length === 2
    );
  }

  // Compartilhado pelos dois caminhos de fechamento (WhatsApp e pagamento online) —
  // a única diferença real entre eles é o `canal`. "Salvar meus dados" funciona igual
  // nos dois; como POST /clientes agora é upsert por e-mail, chamar de novo se o
  // usuário mudar de canal no meio do caminho não duplica nem quebra nada.
  async function criarPedidoNoBackend(canal: 'whatsapp' | 'site'): Promise<PedidoCriado> {
    // Última revalidação antes de criar o pedido — pega estoque/preço mais recentes.
    const carrinhoAtual = await carrinhoQuery.refetch();
    if (carrinhoAtual.error) throw carrinhoAtual.error;

    let clienteId: string | undefined;
    if (form.salvarDados) {
      const cliente = await criarCliente({
        nome: form.nome,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
      });
      clienteId = cliente.id;
      window.localStorage.setItem('atlas-cliente-id', cliente.id);
    }

    return criarPedido({
      itens: itens.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade })),
      tipoEntrega: form.tipoEntrega,
      endereco:
        form.tipoEntrega === 'ENTREGA'
          ? {
              cep: cepLimpo,
              logradouro: form.logradouro,
              numero: form.numero,
              complemento: form.complemento || undefined,
              bairro: form.bairro,
              cidade: form.cidade,
              estado: form.estado,
            }
          : undefined,
      contato: {
        nome: form.nome,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
      },
      clienteId,
      canal,
    });
  }

  async function confirmarPedidoWhatsApp() {
    setEnviando(true);
    try {
      const pedido = await criarPedidoNoBackend('whatsapp');
      limpar();
      const link = montarLinkWhatsApp(WHATSAPP_NUMERO, pedido);
      window.open(link, '_blank');
      router.push('/catalogo');
      showToast('Pedido registrado! Continue pelo WhatsApp pra fechar.', 'success');
    } catch (erro) {
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível criar o pedido. Tente de novo.',
        'error',
      );
    } finally {
      setEnviando(false);
    }
  }

  // Chamado ao escolher "Pagar agora": cria o pedido (canal 'site', fica CRIADO
  // aguardando pagamento) se ainda não criou, e monta o Brick com o total real
  // devolvido pelo backend (já inclui frete).
  async function iniciarPagamentoNoSite() {
    if (pedidoPagamento) return;
    setCarregandoPagamento(true);
    setResultadoPagamento(null);
    try {
      const pedido = await criarPedidoNoBackend('site');
      setPedidoPagamento(pedido);
      await renderizarPaymentBrick({
        containerId: 'payment-brick-container',
        valor: pedido.total,
        emailPagador: form.email || undefined,
        onSubmit: async (formData: PaymentBrickFormData) => {
          const resultado = await enviarPagamentoDoBrick(pedido.id, formData);
          await desmontarPaymentBrick();
          tratarResultadoPagamento(resultado, formData.payment_method_id === 'pix', pedido.id);
        },
        onErro: (erro) => {
          const mensagem =
            erro instanceof ApiError
              ? erro.message
              : erro instanceof Error
                ? erro.message
                : 'Não foi possível processar o pagamento. Confira os dados e tente novamente.';
          setResultadoPagamento({ tipo: 'erro', mensagem });
        },
      });
    } catch (erro) {
      showToast(
        erro instanceof ApiError ? erro.message : 'Não foi possível iniciar o pagamento.',
        'error',
      );
      setMetodoFechamento('whatsapp');
    } finally {
      setCarregandoPagamento(false);
    }
  }

  function tratarResultadoPagamento(
    resultado: { status: string; qrCode?: string; qrCodeBase64?: string },
    ehPix: boolean,
    pedidoId: string,
  ) {
    if (ehPix) {
      setResultadoPagamento({
        tipo: 'pix',
        qrCode: resultado.qrCode,
        qrCodeBase64: resultado.qrCodeBase64,
        status: 'aguardando',
      });
      pararPollingRef.current?.();
      pararPollingRef.current = acompanharPagamentoPix(pedidoId, {
        aoAtualizar: (status) => {
          if (status === 'PAGO') {
            limpar();
            setResultadoPagamento({ tipo: 'sucesso' });
          } else if (status === 'CANCELADO' || status === 'ESTORNADO') {
            setResultadoPagamento((prev) =>
              prev?.tipo === 'pix' ? { ...prev, status: 'cancelado' } : prev,
            );
          } else {
            setResultadoPagamento((prev) =>
              prev?.tipo === 'pix' ? { ...prev, status: 'timeout' } : prev,
            );
          }
        },
      });
    } else {
      // RECUSADO nunca chega aqui — o backend lança PagamentoRecusadoException (402),
      // capturado no catch do onSubmit acima e tratado via onErro.
      limpar();
      setResultadoPagamento({ tipo: 'sucesso' });
    }
  }

  function escolherMetodoFechamento(metodo: 'whatsapp' | 'pagar') {
    setMetodoFechamento(metodo);
    if (metodo === 'whatsapp') {
      pararPollingRef.current?.();
      pararPollingRef.current = null;
      desmontarPaymentBrick();
      setPedidoPagamento(null);
      setResultadoPagamento(null);
    } else {
      iniciarPagamentoNoSite();
    }
  }

  function comprarNovamente() {
    router.push('/catalogo');
  }

  // Sair do passo Revisão enquanto o Brick está ativo deixaria o controller do MP
  // apontando pra um container que o React acabou de desmontar — limpa tudo antes de
  // voltar (mesmo cleanup de trocar pra WhatsApp). Se o usuário voltar pra cá depois,
  // escolhe "Pagar agora" de novo e um novo pedido é criado — mesmo trade-off já aceito
  // de poder gerar mais de um pedido 'site' se o usuário for e voltar várias vezes.
  function voltarDoPasso2() {
    if (metodoFechamento === 'pagar') {
      escolherMetodoFechamento('whatsapp');
    }
    setPasso(1);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkPronto(true)}
      />
      <h1 className="mb-2 font-display text-2xl font-bold text-navy">Finalizar pedido</h1>
      <ol className="mb-8 flex gap-4 text-[13px] font-semibold text-muted">
        {PASSOS.map((nome, i) => (
          <li
            key={nome}
            className={i === passo ? 'text-navy' : i < passo ? 'text-blue' : undefined}
          >
            {i + 1}. {nome}
          </li>
        ))}
      </ol>

      {passo === 0 && (
        <div className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            required
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Telefone"
            placeholder="(22) 99999-8888"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={form.salvarDados}
              onChange={(e) => setForm({ ...form, salvarDados: e.target.checked })}
              className="h-4 w-4 accent-blue"
            />
            Salvar meus dados pra próxima compra
          </label>
          <Button disabled={!podeAvancarPasso0()} onClick={() => setPasso(1)}>
            Continuar
          </Button>
        </div>
      )}

      {passo === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Radio
              name="tipoEntrega"
              label="Entrega"
              checked={form.tipoEntrega === 'ENTREGA'}
              onChange={() => setForm({ ...form, tipoEntrega: 'ENTREGA' })}
            />
            <Radio
              name="tipoEntrega"
              label="Retirada na loja"
              checked={form.tipoEntrega === 'RETIRADA'}
              onChange={() => setForm({ ...form, tipoEntrega: 'RETIRADA' })}
            />
          </div>

          {form.tipoEntrega === 'ENTREGA' && (
            <>
              <Input
                label="CEP"
                required
                value={form.cep}
                onChange={(e) => setForm({ ...form, cep: e.target.value })}
                onBlur={aoSairDoCep}
                error={erroCep ?? undefined}
              />
              <Input
                label="Logradouro"
                required
                value={form.logradouro}
                onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Número"
                  required
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
                <Input
                  label="Complemento"
                  value={form.complemento}
                  onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                />
              </div>
              <Input
                label="Bairro"
                required
                value={form.bairro}
                onChange={(e) => setForm({ ...form, bairro: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Cidade"
                  required
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
                <Input
                  label="Estado (UF)"
                  required
                  maxLength={2}
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
                />
              </div>
              {freteQuery.isLoading && <p className="text-[13px] text-muted">Calculando frete…</p>}
              {freteQuery.data && (
                <p className="text-[13px] font-semibold text-navy">
                  Frete:{' '}
                  {formatarMoeda(freteQuery.data.opcoes.find((o) => o.tipo === 'ENTREGA')!.valor)}
                </p>
              )}
            </>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setPasso(0)} className="flex-1">
              Voltar
            </Button>
            <Button disabled={!podeAvancarPasso1()} onClick={() => setPasso(2)} className="flex-1">
              Continuar
            </Button>
          </div>
        </div>
      )}

      {passo === 2 && resultadoPagamento?.tipo === 'sucesso' && (
        <div className="flex flex-col items-center gap-3 rounded-atlas border border-line bg-white p-8 text-center shadow-atlas">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green text-white">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-navy">Pagamento aprovado!</h2>
          <p className="text-[13px] text-muted">
            Pedido #{pedidoPagamento?.id.slice(0, 8)} — já estamos preparando.
          </p>
          <Button onClick={comprarNovamente} className="mt-2">
            Comprar novamente
          </Button>
        </div>
      )}

      {passo === 2 && resultadoPagamento?.tipo !== 'sucesso' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-atlas border border-line bg-white p-4 shadow-atlas">
            <h2 className="mb-2 font-display text-[14px] font-bold text-navy">Itens</h2>
            {carrinhoQuery.data?.itens.map((item) => (
              <div key={item.produtoId} className="flex justify-between text-[13px] text-ink">
                <span>
                  {item.quantidade}x {item.nome}
                </span>
                <span>{formatarMoeda(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="rounded-atlas border border-line bg-white p-4 shadow-atlas">
            <h2 className="mb-2 font-display text-[14px] font-bold text-navy">Contato</h2>
            <p className="text-[13px] text-ink">{form.nome}</p>
            {form.email && <p className="text-[13px] text-muted">{form.email}</p>}
            {form.telefone && <p className="text-[13px] text-muted">{form.telefone}</p>}
          </div>

          <div className="rounded-atlas border border-line bg-white p-4 shadow-atlas">
            <h2 className="mb-2 font-display text-[14px] font-bold text-navy">Entrega</h2>
            {form.tipoEntrega === 'RETIRADA' ? (
              <p className="text-[13px] text-ink">Retirada na loja</p>
            ) : (
              <p className="text-[13px] text-ink">
                {form.logradouro}, {form.numero} — {form.bairro}, {form.cidade}/{form.estado}
              </p>
            )}
          </div>

          <p className="text-right font-display text-lg font-bold text-navy">
            Total:{' '}
            {formatarMoeda(
              (carrinhoQuery.data?.total ?? 0) +
                (form.tipoEntrega === 'ENTREGA'
                  ? (freteQuery.data?.opcoes.find((o) => o.tipo === 'ENTREGA')?.valor ?? 0)
                  : 0),
            )}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Radio
              name="metodoFechamento"
              label="Fechar pelo WhatsApp"
              checked={metodoFechamento === 'whatsapp'}
              onChange={() => escolherMetodoFechamento('whatsapp')}
            />
            <Radio
              name="metodoFechamento"
              label={sdkPronto ? 'Pagar agora (Pix/Cartão)' : 'Pagar agora (carregando…)'}
              checked={metodoFechamento === 'pagar'}
              disabled={!sdkPronto}
              onChange={() => escolherMetodoFechamento('pagar')}
            />
          </div>

          {metodoFechamento === 'whatsapp' && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={voltarDoPasso2}
                className="flex-1"
                disabled={enviando}
              >
                Voltar
              </Button>
              <Button onClick={confirmarPedidoWhatsApp} className="flex-1" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Fechar pedido pelo WhatsApp'}
              </Button>
            </div>
          )}

          {metodoFechamento === 'pagar' && (
            <div className="flex flex-col gap-3">
              {carregandoPagamento && (
                <p className="text-[13px] text-muted">Carregando formulário de pagamento…</p>
              )}

              {resultadoPagamento?.tipo === 'erro' && (
                <p className="rounded-atlas-sm bg-red-50 px-4 py-3 text-[13px] text-red-600">
                  {resultadoPagamento.mensagem}
                </p>
              )}

              {resultadoPagamento?.tipo === 'pix' && (
                <div className="flex flex-col items-center gap-3 rounded-atlas border border-line bg-white p-4 text-center shadow-atlas">
                  <p className="text-[13px] text-ink">
                    Escaneie o QR Code ou copie o código Pix abaixo.
                  </p>
                  {resultadoPagamento.qrCodeBase64 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`data:image/png;base64,${resultadoPagamento.qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="h-48 w-48"
                    />
                  )}
                  {resultadoPagamento.qrCode && (
                    <textarea
                      readOnly
                      rows={3}
                      value={resultadoPagamento.qrCode}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full rounded-atlas-sm border border-line bg-paper px-3 py-2 font-mono text-[12px] text-ink"
                    />
                  )}
                  <p className="text-[13px] font-semibold text-navy">
                    {resultadoPagamento.status === 'aguardando' &&
                      'Aguardando confirmação do pagamento…'}
                    {resultadoPagamento.status === 'timeout' &&
                      'Ainda não recebemos a confirmação — se você já pagou, seu pedido será atualizado automaticamente assim que o banco confirmar.'}
                    {resultadoPagamento.status === 'cancelado' && 'Pagamento cancelado.'}
                  </p>
                </div>
              )}

              {/* O Brick se monta aqui dentro (ver iniciarPagamentoNoSite em mercadopago.ts) —
                  fica vazio depois de desmontado num Pix/cartão aprovado. */}
              <div id="payment-brick-container" />

              <Button variant="secondary" onClick={voltarDoPasso2} disabled={enviando}>
                Voltar
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
