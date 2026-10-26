import { test, expect } from '@playwright/test';

// Cobre dois bugs reais achados testando o card "SEO, performance e acessibilidade"
// manualmente com Playwright: Esc não fechava nem o mega menu nem o drawer do
// carrinho (o painel ficava visível via CSS :focus-within mesmo depois do estado
// React mudar) — ver MegaMenu.tsx (suprimido/suprimidoAteRef) e CartDrawer.tsx
// (listener de keydown). Não usa dados de produto (mega menu é estático, carrinho
// vazio ainda monta o dialog) — roda sem precisar do backend no ar.

test.describe('Mega menu', () => {
  test('Esc fecha o painel depois de abrir com teclado', async ({ page }) => {
    await page.goto('/');
    const gatilho = page.getByRole('button', { name: 'Produtos', exact: true });
    await gatilho.focus();
    await page.keyboard.press('Enter');

    const painel = page.locator('#nav-mega-panel');
    await expect(painel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(painel).toBeHidden();
  });

  test('depois do Esc, passar o mouse de novo reabre o painel normalmente', async ({ page }) => {
    await page.goto('/');
    const gatilho = page.getByRole('button', { name: 'Produtos', exact: true });
    await gatilho.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');

    const painel = page.locator('#nav-mega-panel');
    await expect(painel).toBeHidden();

    // `suprimido` não pode vazar pra sempre — reengajar via mouse limpa o estado.
    await gatilho.hover();
    await expect(painel).toBeVisible();
  });
});

test.describe('Carrinho (drawer)', () => {
  test('Esc fecha o drawer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Sua lista/ }).click();

    const drawer = page.getByRole('dialog', { name: 'Sua lista de compras' });
    await expect(drawer).toBeInViewport();

    await page.keyboard.press('Escape');
    // Fechado = saiu de view (translate-x-full leva pra fora do viewport à direita).
    await expect(drawer).not.toBeInViewport();
  });
});
