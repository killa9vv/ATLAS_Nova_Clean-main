import { PrismaClient } from '@prisma/client';
// Import estático direto: products.ts é um arquivo de dados puro (sem imports
// específicos do Next como "@/" ou next/image), então o ts-node do backend
// compila normalmente via require(). Se esse arquivo um dia passar a importar
// algo do Next.js, essa importação cross-projeto quebra — não é um risco hoje,
// mas é o motivo desta observação existir.
import { BRANDS, CATEGORIES, CATEGORY_INFO, PRODUCT_TYPES } from '../../frontend/src/data/products';

const prisma = new PrismaClient();

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
