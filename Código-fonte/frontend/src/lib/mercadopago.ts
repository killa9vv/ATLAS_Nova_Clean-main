import { api } from '@/lib/http';

// O SDK do Mercado Pago (carregado via <Script src="https://sdk.mercadopago.com/js/v2">
// em checkout/page.tsx) não tem types oficiais pra API de Bricks nessa versão — só
// declara o mínimo que este arquivo realmente usa, não o SDK inteiro.
interface MercadoPagoBrickController {
  unmount: () => Promise<void>;
}

interface MercadoPagoBricksBuilder {
  create: (
    tipo: 'payment',
    containerId: string,
    opcoes: Record<string, unknown>,
  ) => Promise<MercadoPagoBrickController>;
}

interface MercadoPagoInstance {
  bricks: () => MercadoPagoBricksBuilder;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, opcoes: { locale: string }) => MercadoPagoInstance;
  }
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? '';

let mp: MercadoPagoInstance | null = null;

function getMp(): MercadoPagoInstance {
  if (!mp) {
    if (typeof window === 'undefined' || !window.MercadoPago) {
      throw new Error(
        'SDK do Mercado Pago não carregou. Verifique sua conexão e recarregue a página.',
      );
    }
    mp = new window.MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
  }
  return mp;
}

// Só os campos do formData do Brick que realmente usamos pra montar o payload de
// POST /pagamentos — o Brick devolve bem mais que isso, mas não precisamos tipar tudo.
export interface PaymentBrickFormData {
  payment_method_id: string;
  token?: string;
  installments?: number;
  payer: {
    email: string;
    identification?: { number?: string };
  };
}

export interface PagamentoResultado {
  pagamentoId: string;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;
}

function paraPayloadDoBackend(pedidoId: string, formData: PaymentBrickFormData) {
  const ehPix = formData.payment_method_id === 'pix';
  return {
    pedidoId,
    metodo: ehPix ? 'PIX' : 'CARTAO_CREDITO',
    pagador: {
      email: formData.payer.email,
      cpf: formData.payer.identification?.number,
    },
    tokenCartao: formData.token,
    parcelas: formData.installments,
    metodoPagamentoId: formData.payment_method_id,
  };
}

export function enviarPagamentoDoBrick(
  pedidoId: string,
  formData: PaymentBrickFormData,
): Promise<PagamentoResultado> {
  return api.post<PagamentoResultado>('/pagamentos', paraPayloadDoBackend(pedidoId, formData));
}

let brickController: MercadoPagoBrickController | null = null;

// Se o Brick não chamar onReady nesse prazo, consideramos que não vai carregar
// (ex.: Public Key inválida às vezes não dispara onError, só nunca fica pronto).
const TEMPO_MAXIMO_CARREGAMENTO_MS = 20_000;

export interface RenderizarPaymentBrickParams {
  containerId: string;
  valor: number;
  emailPagador?: string;
  onSubmit: (formData: PaymentBrickFormData) => Promise<void>;
  onErro?: (erro: unknown) => void;
  onPronto?: () => void;
}

// Renderiza o Payment Brick (Pix + cartão) dentro do elemento com id `containerId`.
// O próprio Brick cuida da tokenização do cartão — nenhum dado sensível passa pelo
// nosso código. Só resolve quando o Brick fica pronto (onReady); rejeita se ele
// falhar ao carregar ou estourar TEMPO_MAXIMO_CARREGAMENTO_MS — sem isso uma falha
// de carregamento deixava o checkout com o container vazio e nenhuma mensagem.
export async function renderizarPaymentBrick({
  containerId,
  valor,
  emailPagador,
  onSubmit,
  onErro,
  onPronto,
}: RenderizarPaymentBrickParams): Promise<void> {
  if (brickController) {
    await brickController.unmount();
    brickController = null;
  }

  let carregou = false;
  let marcarPronto!: () => void;
  let marcarFalha!: (erro: unknown) => void;
  const pronto = new Promise<void>((resolve, reject) => {
    marcarPronto = resolve;
    marcarFalha = reject;
  });
  // onError pode disparar antes de alguém dar await em `pronto` — evita o aviso de
  // rejeição não tratada; o await lá embaixo ainda recebe o erro normalmente.
  pronto.catch(() => {});
  const timer = setTimeout(
    () => marcarFalha(new Error('Tempo esgotado esperando o Payment Brick carregar.')),
    TEMPO_MAXIMO_CARREGAMENTO_MS,
  );

  try {
    const bricksBuilder = getMp().bricks();
    brickController = await bricksBuilder.create('payment', containerId, {
      initialization: {
        amount: valor,
        payer: { email: emailPagador || undefined },
      },
      customization: {
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          bankTransfer: 'all',
        },
      },
      callbacks: {
        onReady: () => {
          carregou = true;
          marcarPronto();
          onPronto?.();
        },
        onError: (erro: unknown) => {
          if (!carregou) {
            marcarFalha(erro);
            return;
          }
          onErro?.(erro);
        },
        onSubmit: ({ formData }: { formData: PaymentBrickFormData }) =>
          onSubmit(formData).catch((erro) => {
            onErro?.(erro);
            throw erro;
          }),
      },
    });
    await pronto;
  } catch (erro) {
    // Erro cru no console pra facilitar diagnóstico (credencial errada, bloqueio de
    // rede etc.) — o usuário só vê a mensagem amigável do checkout.
    console.error('Falha ao carregar o Payment Brick do Mercado Pago:', erro);
    await desmontarPaymentBrick().catch(() => {});
    throw erro;
  } finally {
    clearTimeout(timer);
  }
}

export async function desmontarPaymentBrick(): Promise<void> {
  if (brickController) {
    await brickController.unmount();
    brickController = null;
  }
}

export type StatusPolling = 'PAGO' | 'CANCELADO' | 'ESTORNADO' | 'TIMEOUT';

// Fica perguntando ao backend se o pedido já foi marcado como pago (webhook do
// gateway confirma de forma assíncrona). Usado depois de gerar um Pix. Devolve uma
// função pra cancelar o polling (ex.: componente desmontou, ou usuário mudou de ideia).
export function acompanharPagamentoPix(
  pedidoId: string,
  {
    aoAtualizar,
    intervaloMs = 4000,
    timeoutMs = 10 * 60 * 1000,
  }: { aoAtualizar: (status: StatusPolling) => void; intervaloMs?: number; timeoutMs?: number },
): () => void {
  const inicio = Date.now();
  let parado = false;

  const tick = async () => {
    if (parado) return;
    try {
      const pedido = await api.get<{ status: string; total: number }>(
        `/pedidos/${pedidoId}/status`,
      );
      if (pedido.status === 'PAGO') {
        aoAtualizar('PAGO');
        return;
      }
      if (pedido.status === 'CANCELADO' || pedido.status === 'ESTORNADO') {
        aoAtualizar(pedido.status);
        return;
      }
    } catch {
      // erro de rede pontual durante o polling — tenta de novo no próximo tick
    }

    if (Date.now() - inicio > timeoutMs) {
      aoAtualizar('TIMEOUT');
      return;
    }
    setTimeout(tick, intervaloMs);
  };

  setTimeout(tick, intervaloMs);
  return () => {
    parado = true;
  };
}
