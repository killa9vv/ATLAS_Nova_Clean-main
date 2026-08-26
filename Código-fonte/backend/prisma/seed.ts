import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'url';
import path from 'path';

const prisma = new PrismaClient();

// O projeto compila para CommonJS, e nesse modo o TypeScript reescreve `import()`
// dinâmico em `require()` — que não entende ESM. Usar `new Function` esconde a
// chamada da transformação estática do compilador e preserva o import nativo do Node.
const importarModuloEsm = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<any>;

interface VarianteCatalogo {
  id: string;
  brand: string;
  pack: string;
  price: number;
}

interface TipoCatalogo {
  id: string;
  cat: string;
  name: string;
  variants: VarianteCatalogo[];
}

/** Nome de exibição de cada slug de categoria do catálogo do site. */
const NOME_CATEGORIA: Record<string, string> = {
  limpeza: 'Limpeza',
  descartaveis: 'Descartáveis',
  papelaria: 'Papelaria',
};

/**
 * Importa o catálogo real direto do site estático (atlas-nova-clean-loja/js/data/products.js)
 * para não duplicar os ~126 produtos à mão. Exige que essa pasta tenha um package.json com
 * "type": "module" para o Node conseguir interpretar o `export const` do arquivo.
 */
async function carregarCatalogoDoSite(): Promise<TipoCatalogo[]> {
  const caminho = path.resolve(__dirname, '../../atlas-nova-clean-loja/js/data/products.js');
  const modulo = await importarModuloEsm(pathToFileURL(caminho).href);
  return modulo.PRODUCT_TYPES as TipoCatalogo[];
}

/** Mesma lógica de geração de slug usada pela API (ver src/produtos/application/slug.util.ts). */
function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function main() {
  const tipos = await carregarCatalogoDoSite();
  const slugsUsados = new Set<string>();
  const categoriasCache = new Map<string, string>(); // slug da cat -> id
  const marcasCache = new Map<string, string>(); // nome da marca -> id
  let totalProdutos = 0;

  for (const tipo of tipos) {
    let categoriaId = categoriasCache.get(tipo.cat);
    if (!categoriaId) {
      const categoria = await prisma.categoria.upsert({
        where: { slug: tipo.cat },
        update: {},
        create: { slug: tipo.cat, nome: NOME_CATEGORIA[tipo.cat] ?? tipo.cat },
      });
      categoriaId = categoria.id;
      categoriasCache.set(tipo.cat, categoriaId);
    }

    const produtoTipo = await prisma.produtoTipo.upsert({
      where: { categoriaId_nome: { categoriaId, nome: tipo.name } },
      update: {},
      create: { categoriaId, nome: tipo.name },
    });

    for (const variante of tipo.variants) {
      let marcaId = marcasCache.get(variante.brand);
      if (!marcaId) {
        const marca = await prisma.marca.upsert({
          where: { nome: variante.brand },
          update: {},
          create: { nome: variante.brand },
        });
        marcaId = marca.id;
        marcasCache.set(variante.brand, marcaId);
      }

      let slug = gerarSlug(tipo.name);
      let tentativa = 1;
      while (slugsUsados.has(slug)) {
        tentativa++;
        slug = `${gerarSlug(tipo.name)}-${tentativa}`;
      }
      slugsUsados.add(slug);

      await prisma.produto.upsert({
        where: { id: variante.id },
        update: {
          nome: tipo.name,
          descricao: `${variante.brand} — ${variante.pack}`,
          preco: variante.price,
          categoria: tipo.cat,
          categoriaId,
          marcaId,
          produtoTipoId: produtoTipo.id,
          pack: variante.pack,
        },
        create: {
          id: variante.id,
          nome: tipo.name,
          slug,
          descricao: `${variante.brand} — ${variante.pack}`,
          preco: variante.price,
          estoque: 100,
          categoria: tipo.cat,
          categoriaId,
          marcaId,
          produtoTipoId: produtoTipo.id,
          pack: variante.pack,
          ativo: true,
        },
      });
      totalProdutos++;
    }
  }

  console.log(
    `${totalProdutos} produtos sincronizados com o catálogo do site ` +
      `(${categoriasCache.size} categorias, ${marcasCache.size} marcas).`,
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
