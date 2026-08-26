import { PRODUCT_TYPES, CATEGORIES, BRANDS } from './data/products.js';

const TOP_BRANDS_COUNT = 8;

export function renderMegaMenu() {
  CATEGORIES.forEach((cat) => {
    const el = document.getElementById('nav-types-' + cat);
    if (!el) return;
    const types = PRODUCT_TYPES.filter((t) => t.cat === cat);
    el.innerHTML = types
      .map((t) => `<button class="nav-mega-link" data-detail="${t.id}">${t.name}</button>`)
      .join('');
  });

  const brandsEl = document.getElementById('nav-mega-brands');
  if (brandsEl) {
    brandsEl.innerHTML = BRANDS.slice(0, TOP_BRANDS_COUNT)
      .map(
        ({ brand }) =>
          `<button class="nav-brand-chip" data-brand-view="${encodeURIComponent(brand)}">${brand}</button>`,
      )
      .join('');
  }
}

function positionMega() {
  const trigger = document.getElementById('produtos-trigger');
  const mega = document.getElementById('nav-mega-panel');
  if (!trigger || !mega) return;
  const rect = trigger.getBoundingClientRect();
  mega.style.top = rect.bottom + 8 + 'px';
  mega.style.left = rect.left + 'px';
}

export function initNavDropdowns() {
  renderMegaMenu();

  const item = document.getElementById('produtos-nav-item');
  const trigger = document.getElementById('produtos-trigger');

  item.addEventListener('mouseenter', positionMega);
  window.addEventListener('resize', positionMega);

  trigger.addEventListener('click', () => {
    const willOpen = !item.classList.contains('open');
    item.classList.toggle('open', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) positionMega();
  });

  item.addEventListener('mouseleave', () => {
    item.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  });

  // colunas individuais (Limpeza/Descartáveis/Papelaria) só precisam de um
  // toggle próprio no mobile — no desktop a lista já fica sempre visível.
  document.querySelectorAll('.nav-mega-col-caret').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = btn.dataset.navToggle;
      const list = document.getElementById('nav-types-' + cat);
      const willOpen = !list.classList.contains('open');
      list.classList.toggle('open', willOpen);
      btn.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });
}
