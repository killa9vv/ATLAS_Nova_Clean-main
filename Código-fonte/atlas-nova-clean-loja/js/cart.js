import { PRODUCTS } from './data/products.js';

export const cart = {}; // id -> qty

export function cartTotalCount() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

export function cartTotalPrice() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
}

export function changeQty(id, delta) {
  const current = cart[id] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) {
    delete cart[id];
  } else {
    cart[id] = next;
  }
}

export function removeItem(id) {
  delete cart[id];
}

export function clearCart() {
  Object.keys(cart).forEach((id) => delete cart[id]);
}
