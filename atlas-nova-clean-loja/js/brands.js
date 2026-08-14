// Carrossel de marcas da home e a tela de listagem de produtos por marca,
// aberta e fechada via hash da URL (#marca-<nome>).
import { BRANDS, PRODUCTS } from './data/products.js';
import { cart } from './cart.js';
import { money, iconFor, bgFor } from './utils.js';

// Estilos tipográficos que imitam a "sensação" de uma logo de marca de produto
// (cursiva, itálico bold, blocão, arredondado) — não copiam nenhuma logo real,
// são só variações de fonte/cor pra não usar letrinhas soltas sem graça.
const WORDMARK_STYLES = ['script', 'bold-italic', 'block', 'rounded'];
const WORDMARK_COLORS = ['#D62839','#0B3D91','#1FAA59','#E0663D','#7C5CFA','#0E8A8A','#C7495C','#1B2A8C','#B8860B'];

function brandSlug(brand){
  return brand
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashOf(str, weighted){
  return str.split('').reduce((a,c,i) => a + c.charCodeAt(0) * (weighted ? i+1 : 1), 0);
}

function wordmarkStyle(brand){
  return WORDMARK_STYLES[hashOf(brand, true) % WORDMARK_STYLES.length];
}

function wordmarkColor(brand){
  return WORDMARK_COLORS[hashOf(brand, false) % WORDMARK_COLORS.length];
}

function lengthClass(brand){
  const longestWord = Math.max(...brand.split(' ').map(w => w.length));
  if(longestWord > 9) return 'is-xlong';
  if(longestWord > 6) return 'is-long';
  return '';
}

function brandCard(p){
  const qty = cart[p.id] || 0;
  return `
  <div class="product-card">
    <div class="product-media" style="background:${bgFor(p.id,p.cat)}">
      <span class="tag">${p.cat}</span>
      ${iconFor(p.cat)}
      <img class="product-photo" src="assets/products/${p.id}.jpg" alt="${p.name}" loading="lazy" onerror="this.remove()">
    </div>
    <div class="product-body">
      <div class="product-brand">${p.brand}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-pack">${p.pack}</div>
      <div class="product-footer">
        <div class="product-price mono">${money(p.price)}</div>
        ${qty === 0
          ? `<button class="add-btn" data-add="${p.id}">+ Adicionar</button>`
          : `<div class="stepper">
               <button data-dec="${p.id}">−</button>
               <span>${qty}</span>
               <button data-inc="${p.id}">+</button>
             </div>`
        }
      </div>
    </div>
  </div>`;
}

export function renderBrandCarousel(){
  const track = document.getElementById('brand-carousel');
  const items = BRANDS.map(({brand, count}) => `
    <button class="brand-chip" data-brand-view="${encodeURIComponent(brand)}">
      <span class="brand-logo-wrap">
        <span class="brand-wordmark logo-${wordmarkStyle(brand)} ${lengthClass(brand)}" style="color:${wordmarkColor(brand)}">${brand}</span>
        <img class="brand-logo-img" src="assets/brands/${brandSlug(brand)}.png" alt="${brand}" loading="lazy" onerror="this.remove()">
      </span>
      <span class="brand-chip-count">${count} ${count===1?'produto':'produtos'}</span>
    </button>`
  ).join('');
  // duplica a faixa pra rolagem contínua e perfeitamente encadeada
  // (a segunda cópia é só visual, por isso fica oculta pra leitores de tela)
  track.innerHTML = items + `<div aria-hidden="true" style="display:contents">${items}</div>`;
}

export function renderBrandView(brand){
  const items = PRODUCTS.filter(p => p.brand === brand);
  document.getElementById('brand-view-name').textContent = brand;
  document.getElementById('brand-view-eyebrow').textContent = `${items.length} ${items.length===1?'produto':'produtos'} dessa marca`;
  document.getElementById('brand-view-grid').innerHTML = items.map(brandCard).join('')
    || `<p style="color:var(--muted);font-size:14px;">Nenhum produto encontrado para essa marca.</p>`;
}

let openBrand = null;

export function refreshBrandView(){
  if(openBrand) renderBrandView(openBrand);
}

function openBrandViewSection(brand){
  openBrand = brand;
  renderBrandView(brand);
  document.body.classList.add('viewing-brand');
  document.getElementById('brand-view').removeAttribute('hidden');
  window.scrollTo(0, 0);
}

function closeBrandViewSection(){
  openBrand = null;
  document.body.classList.remove('viewing-brand');
  document.getElementById('brand-view').setAttribute('hidden', '');
}

function syncFromHash(){
  const match = location.hash.match(/^#marca-(.+)$/);
  if(match) openBrandViewSection(decodeURIComponent(match[1]));
  else closeBrandViewSection();
}

export function initBrandView(){
  renderBrandCarousel();

  // clique em qualquer chip de marca (carrossel ou mega menu do cabeçalho)
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-brand-view]');
    if(!chip) return;
    location.hash = 'marca-' + chip.dataset.brandView;
  });

  document.getElementById('brand-back').addEventListener('click', () => {
    location.hash = '';
  });

  window.addEventListener('hashchange', syncFromHash);
  syncFromHash();
}
