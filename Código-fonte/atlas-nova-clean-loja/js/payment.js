import { API_BASE_URL, MERCADOPAGO_PUBLIC_KEY } from './config.js';

let mp = null;
function getMp() {
  if (!mp) {
    if (typeof MercadoPago === 'undefined') {
      throw new Error(
        'SDK do Mercado Pago não carregou. Verifique sua conexão e recarregue a página.',
      );
    }
    mp = new MercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: 'pt-BR' });
  }
  return mp;
}

async function chamarApi(caminho, opcoes) {
  let resposta;
  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes,
    });
  } catch {
    throw new Error(
      'Não conseguimos falar com o sistema de pagamento agora. Tente novamente em instantes.',
    );
  }

  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(corpo.mensagem || 'Não foi possível concluir a operação.');
  }
  return corpo;
}

export async function criarPedido(itens, canal = 'site') {
  return chamarApi('/pedidos', { method: 'POST', body: JSON.stringify({ itens, canal }) });
}

// GET /pedidos/:id (completo) exige login de admin — o checkout de convidado usa
// /status, que devolve só o que a tela de pagamento precisa (status e total).
export async function buscarPedido(pedidoId) {
  return chamarApi(`/pedidos/${pedidoId}/status`, { method: 'GET' });
}

/**
 * Traduz o formData que o Payment Brick devolve (já com o cartão tokenizado
 * pelo próprio Mercado Pago, ou os dados de Pix) para o formato que nosso
 * backend espera em POST /pagamentos.
 */
function paraPayloadDoBackend(pedidoId, formData) {
  const ehPix = formData.payment_method_id === 'pix';
  return {
    pedidoId,
    metodo: ehPix ? 'PIX' : 'CARTAO_CREDITO',
    pagador: {
      email: formData.payer.email,
      cpf: formData.payer?.identification?.number,
    },
    tokenCartao: formData.token,
    parcelas: formData.installments,
    metodoPagamentoId: formData.payment_method_id,
  };
}

export async function enviarPagamentoDoBrick(pedidoId, formData) {
  return chamarApi('/pagamentos', {
    method: 'POST',
    body: JSON.stringify(paraPayloadDoBackend(pedidoId, formData)),
  });
}

let brickController = null;

/**
 * Renderiza o Payment Brick do Mercado Pago (Pix + cartão) dentro do elemento
 * com id `containerId`. O próprio Brick cuida da tokenização do cartão — nenhum
 * dado sensível passa pelo nosso JS.
 */
export async function renderizarPaymentBrick({
  containerId,
  valor,
  emailPagador,
  onSubmit,
  onErro,
  onPronto,
}) {
  if (brickController) {
    await brickController.unmount();
    brickController = null;
  }

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
      onReady: () => onPronto?.(),
      onError: (erro) => onErro?.(erro),
      onSubmit: ({ formData }) =>
        onSubmit(formData).catch((erro) => {
          onErro?.(erro);
          throw erro;
        }),
    },
  });
}

export async function desmontarPaymentBrick() {
  if (brickController) {
    await brickController.unmount();
    brickController = null;
  }
}

/**
 * Fica perguntando ao backend se o pedido já foi marcado como pago (webhook do
 * gateway confirma de forma assíncrona). Usado depois de um pagamento Pix.
 */
export function acompanharPagamentoPix(
  pedidoId,
  { aoAtualizar, intervaloMs = 4000, timeoutMs = 10 * 60 * 1000 },
) {
  const inicio = Date.now();
  let parado = false;

  const tick = async () => {
    if (parado) return;
    try {
      const pedido = await buscarPedido(pedidoId);
      if (pedido.status === 'PAGO') {
        aoAtualizar({ status: 'PAGO' });
        return;
      }
      if (pedido.status === 'CANCELADO' || pedido.status === 'ESTORNADO') {
        aoAtualizar({ status: pedido.status });
        return;
      }
    } catch {
      // erro de rede pontual durante o polling — tenta de novo no próximo tick
    }

    if (Date.now() - inicio > timeoutMs) {
      aoAtualizar({ status: 'TIMEOUT' });
      return;
    }
    setTimeout(tick, intervaloMs);
  };

  setTimeout(tick, intervaloMs);
  return () => {
    parado = true;
  };
}
