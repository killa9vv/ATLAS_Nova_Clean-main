// Fluxo do modal de checkout: alterna entre pedido combinado por WhatsApp e
// pagamento no site (Mercado Pago), monta o resumo do pedido e trata o
// resultado do pagamento (incluindo o acompanhamento de um Pix pendente).
import { STORE_WHATSAPP, PRODUCTS } from './data/products.js';
import { cart, cartTotalPrice } from './cart.js';
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

function renderRecap(){
  const entries = Object.entries(cart).filter(([,qty])=>qty>0);
  const itemsHtml = entries.map(([id,qty]) => {
    const p = PRODUCTS.find(x=>x.id===id);
    return `
    <div class="recap-line">
      <span>${qty}x ${p.name} <span class="recap-meta">(${p.brand})</span></span>
      <span class="mono">${money(p.price*qty)}</span>
    </div>`;
  }).join('');

  document.getElementById('order-recap').innerHTML = `
    <div class="recap-head">
      <span>${entries.length} ${entries.length===1?'item':'itens'} na lista</span>
      <span class="mono">${money(cartTotalPrice())}</span>
    </div>
    <div class="recap-items">${itemsHtml}</div>
  `;
}

function dadosCliente(){
  return {
    nome: document.getElementById('c-nome').value.trim(),
    tel: document.getElementById('c-tel').value.trim(),
    email: document.getElementById('c-email').value.trim(),
  };
}

function itensDoCarrinho(){
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([produtoId, quantidade]) => ({ produtoId, quantidade }));
}

function resetarEstadoPagamento(){
  pedidoAtualId = null;
  if (pararAcompanhamentoPix) { pararAcompanhamentoPix(); pararAcompanhamentoPix = null; }
  desmontarPaymentBrick();
  const statusEl = document.getElementById('pagamento-status');
  if (statusEl) statusEl.innerHTML = '';
}

export function initCheckout(){
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
    if(!opt) return;
    [...deliveryToggle.children].forEach(c => c.classList.remove('sel'));
    opt.classList.add('sel');
    deliveryType = opt.dataset.val;
    document.getElementById('endereco-field').style.display = deliveryType === 'Entrega' ? 'block' : 'none';
  });

  const paymentToggle = document.getElementById('payment-toggle');
  const paineis = {
    whatsapp: document.getElementById('panel-whatsapp'),
    site: document.getElementById('panel-site'),
  };
  paymentToggle.addEventListener('click', async (e) => {
    const opt = e.target.closest('.radio-opt');
    if(!opt) return;
    [...paymentToggle.children].forEach(c => c.classList.remove('sel'));
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

function sendWhatsappOrder(){
  const { nome, tel } = dadosCliente();
  const endereco = document.getElementById('c-end').value.trim();
  const obs = document.getElementById('c-obs').value.trim();

  const entries = Object.entries(cart).filter(([,qty])=>qty>0);
  if(entries.length === 0){ alert('Sua lista está vazia.'); return; }

  let msg = `Olá! Meu nome é ${nome || 'Cliente'}, quero fazer um pedido na Atlas Nova Clean:%0A%0A`;
  entries.forEach(([id,qty]) => {
    const p = PRODUCTS.find(x=>x.id===id);
    msg += `• ${qty}x ${p.name} (${p.brand}, ${p.pack}) — ${money(p.price*qty)}%0A`;
  });
  msg += `%0ASubtotal: ${money(cartTotalPrice())}%0A`;
  msg += `Entrega: ${deliveryType}${deliveryType==='Entrega' && endereco ? ' — '+endereco : ''}%0A`;
  if(tel) msg += `Telefone para contato: ${tel}%0A`;
  if(obs) msg += `Observações: ${obs}%0A`;

  window.open(`https://wa.me/${STORE_WHATSAPP}?text=${msg}`, '_blank');
}

function validarDadosPagamento(){
  const { nome, email } = dadosCliente();
  const itens = itensDoCarrinho();
  if (itens.length === 0) { alert('Sua lista está vazia.'); return null; }
  if (!nome) { alert('Preencha seu nome.'); return null; }
  if (!email) { alert('Preencha seu e-mail — é necessário para gerar o pagamento.'); return null; }
  return { nome, email, itens };
}

async function iniciarPagamentoNoSite(){
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
        tratarResultadoPagamento(resultado, formData.payment_method_id === 'pix');
      },
      onErro: (erro) => {
        const mensagem = erro?.message || 'Não foi possível processar o pagamento. Confira os dados e tente novamente.';
        statusEl.innerHTML = `<div class="payment-status payment-status-erro">${mensagem}</div>`;
      },
    });
  } catch (erro) {
    statusEl.innerHTML = `<div class="payment-status payment-status-erro">${erro.message}</div>`;
  }
}

function tratarResultadoPagamento(resultado, ehPix){
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
        if (status === 'PAGO') pixStatusEl.textContent = '✓ Pagamento confirmado! Já estamos preparando seu pedido.';
        else if (status === 'TIMEOUT') pixStatusEl.textContent = 'Ainda não recebemos a confirmação — se você já pagou, seu pedido será atualizado automaticamente assim que o banco confirmar.';
        else pixStatusEl.textContent = `Pagamento ${status.toLowerCase()}.`;
      },
    });
  } else {
    statusEl.innerHTML = `<div class="payment-status">Pagamento ${resultado.status.toLowerCase()}.</div>`;
  }
}
