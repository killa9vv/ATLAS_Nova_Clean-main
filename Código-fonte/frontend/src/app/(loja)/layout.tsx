import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME, SITE_DESCRICAO } from '@/lib/site';
import { fontVariables } from '@/lib/fonts';
import { hrefWhatsApp } from '@/lib/whatsapp';
import { QueryProvider } from '@/lib/query-provider';
import { ToastProvider } from '@/components/ui/Toast';
import { CartProvider } from '@/lib/cart-context';
import { Header } from '@/components/layout/Header';
import { Ticker } from '@/components/layout/Ticker';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { WhatsAppFab } from '@/components/loja/WhatsAppFab';
import { JsonLd } from '@/components/JsonLd';
import '../globals.css';

// Um por site (não por página) — identifica a loja como entidade pros buscadores,
// independente de qual página carregou primeiro.
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESCRICAO,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Arthur Bernardes, 619',
    addressLocality: 'Campos dos Goytacazes',
    addressRegion: 'RJ',
    addressCountry: 'BR',
  },
  sameAs: [
    'https://instagram.com/atlasnovaclean',
    'https://facebook.com/atlasnovaclean',
    hrefWhatsApp(),
  ],
};

const TITULO_PADRAO =
  'Atlas Nova Clean — Limpeza, Descartáveis e Papelaria em Campos dos Goytacazes';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITULO_PADRAO,
    // Páginas da loja (produto, catálogo, marca) só precisam setar `title: 'X'`
    // — isso vira "X | Atlas Nova Clean" automaticamente.
    template: '%s | Atlas Nova Clean',
  },
  description: SITE_DESCRICAO,
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITULO_PADRAO,
    description: SITE_DESCRICAO,
    images: [{ url: '/logo.png', width: 313, height: 313, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary',
    title: TITULO_PADRAO,
    description: SITE_DESCRICAO,
    images: ['/logo.png'],
  },
};

export default function LojaLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${fontVariables} antialiased`}>
      <body>
        <JsonLd data={ORGANIZATION_JSON_LD} />
        <QueryProvider>
          <ToastProvider>
            <CartProvider>
              <Header variant="full" />
              <Ticker />
              {children}
              <Footer variant="full" />
              <WhatsAppFab />
              <CartDrawer />
            </CartProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
