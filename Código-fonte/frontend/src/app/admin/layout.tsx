import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import { QueryProvider } from '@/lib/query-provider';
import { ToastProvider } from '@/components/ui/Toast';
import '../globals.css';

// Root layout próprio do painel admin (ver app/(loja)/layout.tsx pro da loja) —
// sem Header/Ticker/Footer da vitrine. Dois root layouts via route groups é o
// jeito padrão do Next.js de dar uma casca totalmente diferente pra uma seção
// do site; navegar entre /admin e a loja recarrega a página (esperado, são
// "apps" diferentes).
export const metadata: Metadata = {
  title: 'Painel Admin — Atlas Nova Clean',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fontVariables} antialiased`}>
      <body className="bg-paper text-ink">
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
