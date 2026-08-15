import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { Header } from '@/components/layout/Header';
import { Ticker } from '@/components/layout/Ticker';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atlas Nova Clean — Limpeza, Descartáveis e Papelaria em Campos dos Goytacazes',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${fontVariables} antialiased`}>
      <body>
        <Header variant="full" />
        <Ticker />
        {children}
        <Footer variant="full" />
      </body>
    </html>
  );
}
