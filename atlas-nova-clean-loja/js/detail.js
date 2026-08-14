// Tela de detalhe de um produto (com seleção de marca/variante), aberta e
// fechada via hash da URL (#produto-<id>) para funcionar com o botão voltar.
import { PRODUCT_TYPES, CATEGORY_INFO } from './data/products.js';
import { cart } from './cart.js';
import { money, iconFor } from './utils.js';

let currentType = null;
let currentVariant = null;

function renderQtyRow(){
  const v = currentVariant;
  const qty = cart[v.id] || 0;
  document.getElementById('detail-qty-row').innerHTML = qty === 0
    ? `<button class="add-btn" data-add="${v.id}">+ Adicionar</button>`
    : `<div class="stepper">
         <button data-dec="${v.id}">−</button>
         <span>${qty}</span>
         <button data-inc="${v.id}">+</button>
       </div>`;
}

function renderDetail(){
  const t = currentType;
  const v = currentVariant;

  document.getElementById('detail-tag').textContent = t.cat;
  document.getElementById('detail-icon').innerHTML = iconFor(t.cat);
  const photo = document.getElementById('detail-photo');
  photo.style.display = '';
  photo.src = `assets/products/${v.id}.jpg`;
  document.getElementById('detail-name').textContent = t.name;
  document.getElementById('detail-brand').textContent = v.brand;
  document.getElementById('detail-price').textContent = money(v.price);
  document.getElementById('detail-pack').textContent = v.pack;

  const defaults = CATEGORY_INFO[t.cat] || {};
  document.getElementById('detail-tech').textContent = v.info || defaults.info || '—';
  document.getElementById('detail-precautions').textContent = v.precautions || defaults.precautions || '—';

  renderQtyRow();
}

export function openDetailView(typeId, variantId){
  const t = PRODUCT_TYPES.find(x => x.id === typeId);
  if(!t) return;
  currentType = t;
  currentVariant = (variantId && t.variants.find(v => v.id === variantId)) || t.variants[0];

  const select = document.getElementById('brand-select');
  select.innerHTML = t.variants.map(v =>
    `<option value="${v.id}" ${v.id === currentVariant.id ? 'selected' : ''}>${v.brand} — ${v.pack}</option>`
  ).join('');

  renderDetail();
  document.body.classList.add('viewing-detail');
  document.getElementById('product-detail').removeAttribute('hidden');
  window.scrollTo(0, 0);
}

export function closeDetailView(){
  document.body.classList.remove('viewing-detail');
  document.getElementById('product-detail').setAttribute('hidden', '');
}

export function refreshDetailQty(){
  if(currentVariant) renderQtyRow();
}

function syncFromHash(){
  const match = location.hash.match(/^#produto-(.+)$/);
  if(match) openDetailView(decodeURIComponent(match[1]));
  else closeDetailView();
}

export function initDetailView(){
  document.getElementById('brand-select').addEventListener('change', (e) => {
    currentVariant = currentType.variants.find(v => v.id === e.target.value);
    renderDetail();
  });
  document.getElementById('detail-back').addEventListener('click', () => {
    location.hash = '';
  });
  window.addEventListener('hashchange', syncFromHash);
  syncFromHash();
}
