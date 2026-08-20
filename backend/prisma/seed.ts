import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProdutoVarianteCatalogo {
  id: string;
  brand: string;
  pack: string;
  price: number;
}

interface ProdutoTipoCatalogo {
  id: string;
  cat: string;
  name: string;
  variants: ProdutoVarianteCatalogo[];
}

interface CatalogoFrontend {
  PRODUCT_TYPES: ProdutoTipoCatalogo[];
  CATEGORIES: string[];
  CATEGORY_INFO: Record<string, { info: string; precautions: string }>;
  BRANDS: Array<{ brand: string; count: number }>;
}

/**
 * Carrega o catálogo de frontend/src/data/products.ts via `require()` com um
 * caminho calculado em runtime (não um `import` estático). Isso é proposital:
 * um `import` literal faria o TypeScript do backend puxar esse arquivo pra
 * dentro do próprio "programa" de compilação — e como ele mora fora de
 * `backend/`, isso corrompe o cálculo automático de rootDir/outDir (o `nest
 * build` passa a gerar `dist/backend/src/main.js` em vez de `dist/main.js`,
 * silenciosamente, sem erro). Com `require()` de uma string não-literal, o
 * compilador não enxerga o alvo do import — só o `ts-node` resolve isso em
 * runtime (mesmo mecanismo usado pela versão anterior deste seed pra ler o
 * catálogo do site estático). O tipo é declarado localmente acima em vez de
 * importado, pelo mesmo motivo: nada aqui referencia arquivos de fora do
 * backend em tempo de compilação.
 */
function carregarCatalogo(): CatalogoFrontend {
  const caminho = path.resolve(__dirname, '../../frontend/src/data/products.ts');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(caminho) as CatalogoFrontend;
}

const { PRODUCT_TYPES, CATEGORIES, CATEGORY_INFO, BRANDS } = carregarCatalogo();

async function seedCategorias() {
  const categorias = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const nome = cat.charAt(0).toUpperCase() + cat.slice(1);
    const categoria = await prisma.categoria.upsert({
      where: { slug: cat },
      update: { nome },
      create: { slug: cat, nome },
    });
    categorias.set(cat, categoria.id);
  }
  return categorias;
}

async function seedMarcas() {
  const marcas = new Map<string, string>();
  for (const { brand } of BRANDS) {
    const marca = await prisma.marca.upsert({
      where: { nome: brand },
      update: {},
      create: { nome: brand },
    });
    marcas.set(brand, marca.id);
  }
  return marcas;
}

async function seedProdutoTipos(categoriaIdPorSlug: Map<string, string>) {
  const produtoTipos = new Map<string, string>();
  for (const tipo of PRODUCT_TYPES) {
    const info = CATEGORY_INFO[tipo.cat];
    const produtoTipo = await prisma.produtoTipo.upsert({
      where: {
        categoriaId_nome: { categoriaId: categoriaIdPorSlug.get(tipo.cat)!, nome: tipo.name },
      },
      update: { infoTecnica: info.info, precaucoes: info.precautions },
      create: {
        categoriaId: categoriaIdPorSlug.get(tipo.cat)!,
        nome: tipo.name,
        infoTecnica: info.info,
        precaucoes: info.precautions,
      },
    });
    produtoTipos.set(tipo.id, produtoTipo.id);
  }
  return produtoTipos;
}

async function seedProdutos(
  produtoTipoIdPorTipo: Map<string, string>,
  marcaIdPorNome: Map<string, string>,
) {
  let total = 0;
  for (const tipo of PRODUCT_TYPES) {
    for (const variante of tipo.variants) {
      await prisma.produto.upsert({
        where: { id: variante.id },
        update: {
          nome: tipo.name,
          pack: variante.pack,
          preco: variante.price,
          produtoTipoId: produtoTipoIdPorTipo.get(tipo.id)!,
          marcaId: marcaIdPorNome.get(variante.brand)!,
        },
        create: {
          id: variante.id,
          nome: tipo.name,
          pack: variante.pack,
          preco: variante.price,
          estoque: 100,
          produtoTipoId: produtoTipoIdPorTipo.get(tipo.id)!,
          marcaId: marcaIdPorNome.get(variante.brand)!,
        },
      });
      total++;
    }
  }
  return total;
}

async function main() {
  const categoriaIdPorSlug = await seedCategorias();
  const marcaIdPorNome = await seedMarcas();
  const produtoTipoIdPorTipo = await seedProdutoTipos(categoriaIdPorSlug);
  const totalProdutos = await seedProdutos(produtoTipoIdPorTipo, marcaIdPorNome);

  console.log(
    `${categoriaIdPorSlug.size} categorias, ${marcaIdPorNome.size} marcas, ` +
      `${produtoTipoIdPorTipo.size} tipos de produto e ${totalProdutos} produtos sincronizados com o catálogo do frontend.`,
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
