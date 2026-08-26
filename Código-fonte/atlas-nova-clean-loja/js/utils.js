import { CATEGORY_COLORS } from './data/products.js';

export function money(n) {
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

export function iconFor(cat) {
  if (cat === 'limpeza') {
    return `<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#0B1F4D" stroke-width="1.6"><path d="M9 3h6v3l1.5 2v11a1 1 0 01-1 1h-7a1 1 0 01-1-1V8L9 6V3z"/><path d="M9 11h6"/></svg>`;
  }
  if (cat === 'descartaveis') {
    return `<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#0B1F4D" stroke-width="1.6"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M4 8h16"/><path d="M9 8V5a3 3 0 016 0v3"/></svg>`;
  }
  return `<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#0B1F4D" stroke-width="1.6"><path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`;
}

export function bgFor(id, cat) {
  const palette = CATEGORY_COLORS[cat];
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}
