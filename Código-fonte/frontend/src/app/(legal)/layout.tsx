import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontVariables } from '@/lib/fonts';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Atlas Nova Clean',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

// Root layout próprio (padrão "multiple root layouts" do Next, mesmo usado por
// (loja) e admin) — páginas jurídicas não precisam de carrinho, busca nem toast,
// só do header/footer enxutos (Header/Footer variant="simple", já existentes).
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fontVariables} antialiased`}>
      <body>
        <Header variant="simple" />
        {children}
        <Footer variant="simple" />
      </body>
    </html>
  );
}
