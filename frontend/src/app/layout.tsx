import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
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
      <body>{children}</body>
    </html>
  );
}
