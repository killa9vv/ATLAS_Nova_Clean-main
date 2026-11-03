import { listarProdutos } from '@/lib/produtos';
import { NovidadesVitrine } from './NovidadesVitrine';

const QUANTIDADE = 12;
// Estoque/preço/ativo mudam via admin a qualquer momento — revalidate curto.
const REVALIDATE_SEGUNDOS = 120;
// Abaixo disso o carrossel fica esparso demais pra fazer sentido como "novidades".
const MINIMO_PARA_EXIBIR = 3;

export async function NovidadesSection() {
  let itens;
  try {
    const resultado = await listarProdutos(
      { pagina: 1, limite: QUANTIDADE, ordenarPor: 'createdAt', direcao: 'desc' },
      { next: { revalidate: REVALIDATE_SEGUNDOS } },
    );
    itens = resultado.itens;
  } catch {
    // Isolado: se /produtos falhar aqui, some só essa seção — o resto da home segue.
    return null;
  }

  if (itens.length < MINIMO_PARA_EXIBIR) return null;

  return (
    <section aria-label="Novidades" className="mx-auto max-w-[1180px] px-5 py-10">
      <NovidadesVitrine produtos={itens} />
    </section>
  );
}
