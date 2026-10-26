import { test, expect } from '@playwright/test';

// Cobre os itens de código do card "SEO, performance e acessibilidade": metadata/OG,
// sitemap.xml, robots.txt e JSON-LD (Organization/Product). As duas últimas
// (`sitemap.spec.ts` dinâmico e a página de produto) dependem do backend no ar —
// se ele cair, o próprio sitemap.ts degrada pras páginas estáticas (ver try/catch
// nele) e o teste de JSON-LD de produto vai falhar claramente em vez de passar falso.

// t-pasta é um produtoTipo real do seed (ver backend/scripts/importar-catalogo.mjs).
const SLUG_PRODUTO_CONHECIDO = '/produtos/t-pasta';

test('home tem metadata e Open Graph corretos', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Atlas Nova Clean/);

  const ogTitle = page.locator('meta[property="og:title"]');
  await expect(ogTitle).toHaveAttribute('content', /Atlas Nova Clean/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
});

test('card do catálogo leva pra página de produto com título no template certo', async ({
  page,
}) => {
  await page.goto('/catalogo');
  // Escopado em <main> de propósito — o mega menu do header tem os mesmos hrefs
  // /produtos/:slug nos links de categoria, só que escondidos (display:none fora
  // de hover/foco), e um seletor sem escopo encontra esses primeiro.
  const primeiroLink = page.locator('main a[href^="/produtos/"]').first();
  await primeiroLink.waitFor({ state: 'visible', timeout: 15_000 });
  await primeiroLink.click();

  await page.waitForURL(/\/produtos\//);
  await expect(page).toHaveTitle(/ \| Atlas Nova Clean$/);
});

test('robots.txt aponta pro sitemap e bloqueia áreas privadas', async ({ request }) => {
  const resposta = await request.get('/robots.txt');
  expect(resposta.ok()).toBeTruthy();
  const corpo = await resposta.text();
  expect(corpo).toContain('Disallow: /admin');
  expect(corpo).toContain('Disallow: /checkout');
  expect(corpo).toMatch(/Sitemap: .+\/sitemap\.xml/);
});

test('sitemap.xml é XML válido com as páginas estáticas', async ({ request }) => {
  const resposta = await request.get('/sitemap.xml');
  expect(resposta.ok()).toBeTruthy();
  const corpo = await resposta.text();
  expect(corpo).toContain('<urlset');
  expect(corpo).toContain('/catalogo</loc>');
  expect(corpo).toContain('/politica-entrega</loc>');
});

test('JSON-LD Organization aparece em toda página da loja', async ({ page }) => {
  await page.goto('/');
  const script = page.locator('script[type="application/ld+json"]').first();
  const json = JSON.parse(await script.innerText());
  expect(json['@type']).toBe('Organization');
  expect(json.name).toBe('Atlas Nova Clean');
  expect(json.address.addressLocality).toBe('Campos dos Goytacazes');
});

test('JSON-LD Product aparece na página de produto com oferta e preço', async ({ page }) => {
  await page.goto(SLUG_PRODUTO_CONHECIDO);

  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  let encontrouProduct = false;
  for (let i = 0; i < count; i++) {
    const json = JSON.parse(await scripts.nth(i).innerText());
    if (json['@type'] === 'Product') {
      encontrouProduct = true;
      expect(json.offers['@type']).toBe('Offer');
      expect(json.offers.priceCurrency).toBe('BRL');
      expect(typeof json.offers.price).toBe('number');
      expect(['https://schema.org/InStock', 'https://schema.org/OutOfStock']).toContain(
        json.offers.availability,
      );
    }
  }
  expect(encontrouProduct).toBe(true);
});
