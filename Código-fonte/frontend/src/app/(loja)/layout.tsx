import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { QueryProvider } from '@/lib/query-provider';
import { ToastProvider } from '@/components/ui/Toast';
import { Header } from '@/components/layout/Header';
import { Ticker } from '@/components/layout/Ticker';
import { Footer } from '@/components/layout/Footer';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Atlas Nova Clean — Limpeza, Descartáveis e Papelaria em Campos dos Goytacazes',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function LojaLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${fontVariables} antialiased`}>
      <body>
        <QueryProvider>
          <ToastProvider>
            <Header variant="full" />
            <Ticker />
            {children}
            <Footer variant="full" />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
