import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// /admin já tem `robots: noindex` na própria metadata (defesa em profundidade —
// alguns crawlers ignoram meta robots mas respeitam robots.txt, e vice-versa).
// /conta, /carrinho e /checkout são páginas transacionais/privadas por sessão,
// sem conteúdo que valha indexar.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/conta', '/carrinho', '/checkout'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
