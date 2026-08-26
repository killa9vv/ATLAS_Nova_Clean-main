import { STORE_WHATSAPP, PRODUCTS } from './data/products.js';
import { cart, cartTotalPrice, clearCart } from './cart.js';
import { renderCart, renderAllGrids } from './render.js';
import { money } from './utils.js';
import {
  criarPedido,
  buscarPedido,
  enviarPagamentoDoBrick,
  renderizarPaymentBrick,
  desmontarPaymentBrick,
  acompanharPagamentoPix,
} from './payment.js';

let deliveryType = 'Retirada na loja';
let paymentMethod = 'whatsapp';
let pararAcompanhamentoPix = null;
let pedidoAtualId = null;

function renderRecap() {
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const itemsHtml = entries
    .map(([id, qty]) => {
      const p = PRODUCTS.find((x) => x.id === id);
      return `
    <div class="recap-line">
      <span>${qty}x ${p.name} <span class="recap-meta">(${p.brand})</span></span>
      <span class="mono">${money(p.price * qty)}</span>
    </div>`;
    })
    .join('');

  document.getElementById('order-recap').innerHTML = `
    <div class="recap-head">
      <span>${entries.length} ${entries.length === 1 ? 'item' : 'itens'} na lista</span>
      <span class="mono">${money(cartTotalPrice())}</span>
    </div>
    <div class="recap-items">${itemsHtml}</div>
  `;
}

function dadosCliente() {
  return {
    nome: document.getElementById('c-nome').value.trim(),
    tel: document.getElementById('c-tel').value.trim(),
    email: document.getElementById('c-email').value.trim(),
  };
}

function itensDoCarrinho() {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
}

function resetarEstadoPagamento() {
  pedidoAtualId = null;
  if (pararAcompanhamentoPix) {
    pararAcompanhamentoPix();
    pararAcompanhamentoPix = null;
  }
  desmontarPaymentBrick();
  const statusEl = document.getElementById('pagamento-status');
  if (statusEl) statusEl.innerHTML = '';
}

export function initCheckout() {
  const modal = document.getElementById('checkout-modal');

  document.getElementById('go-checkout').addEventListener('click', () => {
    renderRecap();
    modal.classList.add('open');
  });
  document.getElementById('close-modal').addEventListener('click', () => {
    modal.classList.remove('open');
    resetarEstadoPagamento();
  });

  const deliveryToggle = document.getElementById('delivery-toggle');
  deliveryToggle.addEventListener('click', (e) => {
    const opt = e.target.closest('.radio-opt');
    if (!opt) return;
    [...deliveryToggle.children].forEach((c) => c.classList.remove('sel'));
    opt.classList.add('sel');
    deliveryType = opt.dataset.val;
    document.getElementById('endereco-field').style.display =
      deliveryType === 'Entrega' ? 'block' : 'none';
  });

  const paymentToggle = document.getElementById('payment-toggle');
  const paineis = {
    whatsapp: document.getElementById('panel-whatsapp'),
    site: document.getElementById('panel-site'),
  };
  paymentToggle.addEventListener('click', async (e) => {
    const opt = e.target.closest('.radio-opt');
    if (!opt) return;
    [...paymentToggle.children].forEach((c) => c.classList.remove('sel'));
    opt.classList.add('sel');
    paymentMethod = opt.dataset.val;
    Object.entries(paineis).forEach(([chave, painel]) => {
      painel.hidden = chave !== paymentMethod;
    });
    if (paymentMethod === 'site') {
      await iniciarPagamentoNoSite();
    }
  });

  document.getElementById('send-whats').addEventListener('click', sendWhatsappOrder);

  return modal;
}

async function sendWhatsappOrder() {
  const { nome, tel } = dadosCliente();
  const endereco = document.getElementById('c-end').value.trim();
  const obs = document.getElementById('c-obs').value.trim();

  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  if (entries.length === 0) {
    alert('Sua lista está vazia.');
    return;
  }

  const botao = document.getElementById('send-whats');
  const textoOriginalDoBotao = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Enviando...';

  // Registra o pedido no banco (status AGUARDANDO_CONTATO) antes de redirecionar — sem
  // isso, um pedido feito via WhatsApp não deixava nenhum rastro no sistema. Se o
  // registro falhar (backend fora do ar, etc.), não trava a venda: a conversa no
  // WhatsApp continua sendo o combinado de verdade, só fica sem o registro auxiliar.
  try {
    await criarPedido(itensDoCarrinho(), 'whatsapp');
  } catch (erro) {
    console.error('Não foi possível registrar o pedido antes do WhatsApp:', erro);
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginalDoBotao;
  }

  let msg = `Olá! Meu nome é ${nome || 'Cliente'}, quero fazer um pedido na Atlas Nova Clean:%0A%0A`;
  entries.forEach(([id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    msg += `• ${qty}x ${p.name} (${p.brand}, ${p.pack}) — ${money(p.price * qty)}%0A`;
  });
  msg += `%0ASubtotal: ${money(cartTotalPrice())}%0A`;
  msg += `Entrega: ${deliveryType}${deliveryType === 'Entrega' && endereco ? ' — ' + endereco : ''}%0A`;
  if (tel) msg += `Telefone para contato: ${tel}%0A`;
  if (obs) msg += `Observações: ${obs}%0A`;

  window.open(`https://wa.me/${STORE_WHATSAPP}?text=${msg}`, '_blank');
}

function validarDadosPagamento() {
  const { nome, email } = dadosCliente();
  const itens = itensDoCarrinho();
  if (itens.length === 0) {
    alert('Sua lista está vazia.');
    return null;
  }
  if (!nome) {
    alert('Preencha seu nome.');
    return null;
  }
  if (!email) {
    alert('Preencha seu e-mail — é necessário para gerar o pagamento.');
    return null;
  }
  return { nome, email, itens };
}

async function iniciarPagamentoNoSite() {
  const dados = validarDadosPagamento();
  const statusEl = document.getElementById('pagamento-status');
  if (!dados) {
    // volta pro WhatsApp já que faltam dados obrigatórios
    document.querySelector('[data-val="whatsapp"]').click();
    return;
  }

  statusEl.innerHTML = '<div class="payment-status">Carregando formulário de pagamento...</div>';

  try {
    if (!pedidoAtualId) {
      const pedido = await criarPedido(dados.itens);
      pedidoAtualId = pedido.id;
    }
    const pedidoAtual = await buscarPedido(pedidoAtualId);

    statusEl.innerHTML = '';
    await renderizarPaymentBrick({
      containerId: 'payment-brick-container',
      valor: pedidoAtual.total,
      emailPagador: dados.email,
      onSubmit: async (formData) => {
        const resultado = await enviarPagamentoDoBrick(pedidoAtualId, formData);
        // O Brick não some sozinho depois de um onSubmit bem-sucedido — ele espera a
        // página navegar pra outro lugar (padrão do Mercado Pago). Como ficamos na
        // mesma tela, desmontamos aqui pra não deixar o formulário travado por cima
        // da mensagem de resultado.
        await desmontarPaymentBrick();
        tratarResultadoPagamento(resultado, formData.payment_method_id === 'pix');
      },
      onErro: (erro) => {
        const mensagem =
          erro?.message ||
          'Não foi possível processar o pagamento. Confira os dados e tente novamente.';
        statusEl.innerHTML = `<div class="payment-status payment-status-erro">${mensagem}</div>`;
      },
    });
  } catch (erro) {
    statusEl.innerHTML = `<div class="payment-status payment-status-erro">${erro.message}</div>`;
  }
}

const ICONE_APROVADO = `
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>`;

const ICONE_RECUSADO = `
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`;

function renderizarResultadoFinal(container, { aprovado, titulo, texto }) {
  container.innerHTML = `
    <div class="payment-result ${aprovado ? 'payment-result-ok' : 'payment-result-erro'}">
      <div class="payment-result-icon">${aprovado ? ICONE_APROVADO : ICONE_RECUSADO}</div>
      <h4>${titulo}</h4>
      <p>${texto}</p>
      ${aprovado ? '<button class="checkout-btn" id="btn-comprar-novamente" type="button">Comprar novamente</button>' : ''}
    </div>
  `;
  if (aprovado) {
    document
      .getElementById('btn-comprar-novamente')
      .addEventListener('click', finalizarComprarNovamente);
  }
}

function finalizarComprarNovamente() {
  clearCart();
  renderCart();
  renderAllGrids();
  resetarEstadoPagamento();
  document.getElementById('checkout-modal').classList.remove('open');
}

const TEXTO_STATUS = {
  APROVADO: 'Já estamos preparando o seu pedido.',
  RECUSADO: 'A operadora não autorizou a cobrança. Confira os dados do cartão ou tente outro meio de pagamento.',
  CANCELADO: 'O pagamento foi cancelado.',
  EXPIRADO: 'O tempo para pagar esse pedido expirou.',
};

function tratarResultadoPagamento(resultado, ehPix) {
  const statusEl = document.getElementById('pagamento-status');

  if (ehPix) {
    statusEl.innerHTML = `
      <div class="payment-status">Escaneie o QR Code ou copie o código Pix abaixo.</div>
      ${resultado.qrCodeBase64 ? `<img class="qr-code-img" src="data:image/png;base64,${resultado.qrCodeBase64}" alt="QR Code Pix">` : ''}
      ${resultado.qrCode ? `<textarea class="copia-cola" readonly rows="3">${resultado.qrCode}</textarea>` : ''}
      <div class="payment-status" id="pix-status">Aguardando confirmação do pagamento...</div>
    `;
    if (pararAcompanhamentoPix) pararAcompanhamentoPix();
    pararAcompanhamentoPix = acompanharPagamentoPix(pedidoAtualId, {
      aoAtualizar: ({ status }) => {
        const pixStatusEl = document.getElementById('pix-status');
        if (!pixStatusEl) return;
        if (status === 'PAGO') {
          renderizarResultadoFinal(statusEl, {
            aprovado: true,
            titulo: 'Pagamento aprovado!',
            texto: TEXTO_STATUS.APROVADO,
          });
        } else if (status === 'TIMEOUT') {
          pixStatusEl.textContent =
            'Ainda não recebemos a confirmação — se você já pagou, seu pedido será atualizado automaticamente assim que o banco confirmar.';
        } else {
          pixStatusEl.textContent = `Pagamento ${status.toLowerCase()}.`;
        }
      },
    });
  } else {
    const aprovado = resultado.status === 'APROVADO';
    renderizarResultadoFinal(statusEl, {
      aprovado,
      titulo: aprovado ? 'Pagamento aprovado!' : 'Pagamento não concluído',
      texto: TEXTO_STATUS[resultado.status] || `Status: ${resultado.status.toLowerCase()}.`,
    });
  }
}
