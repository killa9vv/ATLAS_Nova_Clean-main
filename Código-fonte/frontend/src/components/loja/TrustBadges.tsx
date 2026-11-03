import { listarProdutos } from '@/lib/produtos';
import { TrustBadgesLista } from './TrustBadgesLista';

// Contagem aproximada é suficiente aqui — não é um dado crítico, revalidate longo.
const REVALIDATE_SEGUNDOS = 3600;

// Só afirmações verificáveis: contagem real do catálogo, e integrações que realmente
// existem (Mercado Pago pro pagamento, WhatsApp pro atendimento). Nada de nota média,
// "clientes satisfeitos" ou tempo de resposta — não temos como provar esses números
// hoje (ver ReviewsSection pras avaliações reais, essas sim vindas do backend).
export async function TrustBadges() {
  let totalProdutos: number | null = null;
  try {
    const resultado = await listarProdutos(
      { pagina: 1, limite: 1 },
      { next: { revalidate: REVALIDATE_SEGUNDOS } },
    );
    totalProdutos = resultado.total;
  } catch {
    // Isolado: sem o total, mostra o selo sem o número em vez de derrubar a seção.
  }

  return <TrustBadgesLista totalProdutos={totalProdutos} />;
}
