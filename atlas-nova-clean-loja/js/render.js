// Renderização das grades de produto por categoria (com filtro de marca e
// busca) e do carrinho lateral (drawer), a partir do catálogo e do carrinho.
import { PRODUCTS, PRODUCT_TYPES, CATEGORIES } from './data/products.js';
import { cart, cartTotalCount, cartTotalPrice } from './cart.js';
import { money, iconFor, bgFor } from './utils.js';

export const activeFilters = {limpeza:'Todas', descartaveis:'Todas', papelaria:'Todas'};
export const expandedCategories = new Set();
const VISIBLE_LIMIT = 8;

export function buildFilters(cat){
  const brands = ['Todas', ...new Set(PRODUCTS.filter(p=>p.cat===cat).map(p=>p.brand))];
  const el = document.getElementById('filters-'+cat);
  el.innerHTML = brands.map(b =>
    `<button class="chip ${activeFilters[cat]===b?'active':''}" data-cat="${cat}" data-brand="${b}">${b}</button>`
  ).join('');
}

function singleCard(t, v){
  const qty = cart[v.id] || 0;
  return `
  <div class="product-card">
    <div class="product-media" style="background:${bgFor(v.id,t.cat)}">
      <span class="tag">${t.cat}</span>
      ${iconFor(t.cat)}
      <img class="product-photo" src="assets/products/${v.id}.jpg" alt="${t.name}" loading="lazy" onerror="this.remove()">
    </div>
    <div class="product-body">
      <div class="product-brand">${v.brand}</div>
      <div class="product-name">${t.name}</div>
      <div class="product-pack">${v.pack}</div>
      <div class="product-footer">
        <div class="product-price mono">${money(v.price)}</div>
        ${qty === 0
          ? `<button class="add-btn" data-add="${v.id}">+ Adicionar</button>`
          : `<div class="stepper">
               <button data-dec="${v.id}">−</button>
               <span>${qty}</span>
               <button data-inc="${v.id}">+</button>
             </div>`
        }
      </div>
    </div>
  </div>`;
}

const CHEVRON = `<svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
const ARROW = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

function groupCard(t){
  const minPrice = Math.min(...t.variants.map(v => v.price));
  return `
  <div class="product-card">
    <div class="product-media" style="background:${bgFor(t.id,t.cat)}">
      <span class="tag">${t.cat}</span>
      ${iconFor(t.cat)}
    </div>
    <div class="product-body">
      <div class="product-name">${t.name}</div>
      <div class="product-pack">${t.variants.length} marcas disponíveis</div>
      <div class="product-footer">
        <div class="product-price mono">a partir de ${money(minPrice)}</div>
        <button class="add-btn" data-detail="${t.id}">
          <span>Ver opções</span>
          ${ARROW}
        </button>
      </div>
    </div>
  </div>`;
}

export function renderGrid(cat){
  const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
  const filterBrand = activeFilters[cat];

  const types = PRODUCT_TYPES
    .filter(t => t.cat === cat)
    .map(t => {
      const variants = filterBrand === 'Todas' ? t.variants : t.variants.filter(v => v.brand === filterBrand);
      return { ...t, variants };
    })
    .filter(t => t.variants.length > 0)
    .filter(t => !searchTerm || (t.name + ' ' + t.variants.map(v => v.brand).join(' ')).toLowerCase().includes(searchTerm));

  document.getElementById('count-'+cat).textContent = types.length + (types.length===1?' produto':' produtos');

  const isExpanded = expandedCategories.has(cat);
  const visibleTypes = isExpanded ? types : types.slice(0, VISIBLE_LIMIT);
  const remaining = types.length - visibleTypes.length;

  const grid = document.getElementById('grid-'+cat);
  const cardsHtml = visibleTypes.map(t =>
    t.variants.length === 1 ? singleCard(t, t.variants[0]) : groupCard(t)
  ).join('') || `<p style="color:var(--muted);font-size:14px;">Nenhum produto encontrado com esse filtro.</p>`;

  const showMoreHtml = types.length > VISIBLE_LIMIT
    ? `<div class="show-more-wrap ${isExpanded ? 'is-expanded' : ''}">
         <button class="show-more-btn ${isExpanded ? 'is-open' : ''}" data-showmore="${cat}">
           <span>${isExpanded ? 'Ver menos' : `Ver mais ${remaining} produtos`}</span>
           ${CHEVRON.replace('class="chevron"', 'class="chevron-down"')}
         </button>
       </div>`
    : '';

  grid.innerHTML = cardsHtml + showMoreHtml;
}

export function renderAllGrids(){
  CATEGORIES.forEach(cat => {
    buildFilters(cat);
    renderGrid(cat);
  });
}

const TRASH_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"></path></svg>`;

export function renderCart(){
  const totalCount = cartTotalCount();
  document.getElementById('cart-count').textContent = totalCount;

  const receipt = document.getElementById('receipt');
  const entries = Object.entries(cart).filter(([,qty])=>qty>0);
  const badge = document.getElementById('item-count-badge');
  const checkoutBtn = document.getElementById('go-checkout');

  if(entries.length === 0){
    badge.hidden = true;
    receipt.innerHTML = `<div class="receipt-empty">Sua lista está vazia.<br>Adicione produtos para começar.</div>`;
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Finalizar pedido';
  } else {
    badge.hidden = false;
    badge.textContent = totalCount;
    receipt.innerHTML = entries.map(([id,qty]) => {
      const p = PRODUCTS.find(x=>x.id===id);
      return `
      <div class="receipt-line">
        <div class="receipt-icon" style="background:${bgFor(id,p.cat)}">${iconFor(p.cat)}</div>
        <div class="receipt-main">
          <div class="name">${p.name}</div>
          <div class="meta">${p.brand} · ${p.pack}</div>
          <div class="receipt-qty">
            <button data-dec="${id}">−</button>
            <span>${qty}</span>
            <button data-inc="${id}">+</button>
          </div>
        </div>
        <div class="receipt-side">
          <div class="receipt-price mono">${money(p.price*qty)}</div>
          <button class="rm" data-rm="${id}" aria-label="Remover ${p.name}">${TRASH_ICON}</button>
        </div>
      </div>`;
    }).join('');
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = `Finalizar pedido · ${money(cartTotalPrice())}`;
  }
  document.getElementById('subtotal').textContent = money(cartTotalPrice());
}
