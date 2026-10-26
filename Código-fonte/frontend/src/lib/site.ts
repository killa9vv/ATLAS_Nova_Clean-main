// Config central do site — reusada pela metadata (layout, Open Graph), pelo
// sitemap.ts, robots.ts e pelo JSON-LD (Organization). Nome/descrição batem com
// o que já é usado no Hero e no <title> da loja.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(
  /\/$/,
  '',
);

export const SITE_NAME = 'Atlas Nova Clean';

export const SITE_DESCRICAO =
  'Limpeza, descartáveis e papelaria em Campos dos Goytacazes, RJ. Atacado e varejo das marcas que você já confia — monte sua lista e feche pelo WhatsApp ou pague direto no site.';
