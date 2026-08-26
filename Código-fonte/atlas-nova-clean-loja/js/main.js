import { CATEGORIES, PRODUCTS } from './data/products.js';
import { changeQty, removeItem } from './cart.js';
import {
  activeFilters,
  expandedCategories,
  buildFilters,
  renderGrid,
  renderAllGrids,
  renderCart,
} from './render.js';
import { initCheckout } from './checkout.js';
import { initScrollReveal } from './reveal.js';
import { initDetailView, refreshDetailQty } from './detail.js';
import { showToast, bumpCartCount } from './toast.js';
import { initBrandView, refreshBrandView } from './brands.js';
import { initReviews } from './reviews.js';
import { initCookieBanner } from './cookies.js';
import { initNavDropdowns } from './nav.js';

function refreshAll() {
  renderCart();
  CATEGORIES.forEach(renderGrid);
  refreshDetailQty();
  refreshBrandView();
}

document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const rm = e.target.closest('[data-rm]');
  const chip = e.target.closest('.chip');
  const detail = e.target.closest('[data-detail]');
  const showMore = e.target.closest('[data-showmore]');

  if (add) {
    changeQty(add.dataset.add, 1);
    refreshAll();
    const p = PRODUCTS.find((x) => x.id === add.dataset.add);
    showToast(`✓ ${p.name} adicionado à lista`);
    bumpCartCount();
  }
  if (inc) {
    changeQty(inc.dataset.inc, 1);
    refreshAll();
  }
  if (dec) {
    changeQty(dec.dataset.dec, -1);
    refreshAll();
  }
  if (rm) {
    removeItem(rm.dataset.rm);
    refreshAll();
  }
  if (chip) {
    activeFilters[chip.dataset.cat] = chip.dataset.brand;
    buildFilters(chip.dataset.cat);
    renderGrid(chip.dataset.cat);
  }
  if (detail) {
    location.hash = 'produto-' + encodeURIComponent(detail.dataset.detail);
  }
  if (showMore) {
    const cat = showMore.dataset.showmore;
    if (expandedCategories.has(cat)) expandedCategories.delete(cat);
    else expandedCategories.add(cat);
    renderGrid(cat);
  }
});

document.getElementById('search-input').addEventListener('input', () => {
  CATEGORIES.forEach(renderGrid);
});

// Drawer open/close
const drawer = document.getElementById('cart-drawer');
const overlay = document.getElementById('overlay');
document.getElementById('open-cart').addEventListener('click', () => {
  drawer.classList.add('open');
  overlay.classList.add('show');
});
document.getElementById('close-cart').addEventListener('click', () => {
  drawer.classList.remove('open');
  overlay.classList.remove('show');
});

const checkoutModal = initCheckout();
overlay.addEventListener('click', () => {
  drawer.classList.remove('open');
  overlay.classList.remove('show');
  checkoutModal.classList.remove('open');
});

// Mobile nav menu
const menuToggle = document.getElementById('menu-toggle');
const headerNav = document.getElementById('header-nav');
menuToggle.addEventListener('click', () => {
  const isOpen = headerNav.classList.toggle('open');
  menuToggle.classList.toggle('open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
headerNav.addEventListener('click', (e) => {
  const isMegaTrigger = e.target.closest('#produtos-trigger');
  const isColCaret = e.target.closest('.nav-mega-col-caret');
  const isNavLink =
    e.target.tagName === 'A' ||
    e.target.closest('.nav-mega-link') ||
    e.target.closest('.nav-brand-chip');

  if (isNavLink && !isMegaTrigger && !isColCaret) {
    headerNav.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    // reseta qualquer submenu aberto (mega + colunas) pra próxima vez
    headerNav.querySelectorAll('.open').forEach((el) => el.classList.remove('open'));
    headerNav
      .querySelectorAll('[aria-expanded="true"]')
      .forEach((el) => el.setAttribute('aria-expanded', 'false'));
  }
});

// Logo do cabeçalho leva pro início da página
document.getElementById('brand-home-link').addEventListener('click', (e) => {
  e.preventDefault();
  headerNav.classList.remove('open');
  menuToggle.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  if (location.hash) location.hash = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('copyright-line').textContent =
  `© ${new Date().getFullYear()} Atlas Nova Clean`;

renderAllGrids();
renderCart();
initScrollReveal();
initDetailView();
initBrandView();
initReviews();
initCookieBanner();
initNavDropdowns();
