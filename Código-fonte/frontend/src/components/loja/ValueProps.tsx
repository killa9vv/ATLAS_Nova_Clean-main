import { listarMarcas } from '@/lib/marcas';
import { listarProdutos } from '@/lib/produtos';
import { ValuePropsProvas, type CategoriaContada } from './ValuePropsProvas';

// Só dá volume do catálogo, sem preço nem estoque — não precisa do revalidate curto.
const REVALIDATE_SEGUNDOS = 3600;

const CATEGORIAS = [
  { slug: 'limpeza', nome: 'Limpeza' },
  { slug: 'descartaveis', nome: 'Descartáveis' },
  { slug: 'papelaria', nome: 'Papelaria' },
];

// Cada argumento vem com a prova, tirada do catálogo real: se o número mudar, a seção muda junto.
export async function ValueProps() {
  const opcoes = { next: { revalidate: REVALIDATE_SEGUNDOS } };
  let categorias: CategoriaContada[] = [];
  let marcas: Awaited<ReturnType<typeof listarMarcas>> = [];
  try {
    const [resultados, listaMarcas] = await Promise.all([
      Promise.all(
        CATEGORIAS.map((categoria) =>
          listarProdutos({ pagina: 1, limite: 1, categoria: categoria.slug }, opcoes),
        ),
      ),
      listarMarcas(opcoes),
    ]);
    categorias = CATEGORIAS.map((categoria, indice) => ({
      nome: categoria.nome,
      total: resultados[indice].total,
    }));
    marcas = listaMarcas;
  } catch {
    // Isolado: sem os dados, os cards seguem só com o texto em vez de derrubar a seção.
  }

  return <ValuePropsProvas categorias={categorias} marcas={marcas} />;
}
