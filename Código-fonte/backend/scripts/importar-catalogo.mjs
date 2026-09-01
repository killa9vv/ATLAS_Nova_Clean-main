// Importa o catálogo real (126 produtos/variantes, 36 marcas) — herdado da versão
// estática antiga da loja, hoje removida — pro Postgres. Idempotente (upsert por
// slug/nome), pode ser usado tanto pra popular um banco novo (`npm run seed`) quanto
// pra rodar de novo sem duplicar.
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCT_TYPES = JSON.parse(
  readFileSync(path.resolve(__dirname, '../prisma/dados/catalogo-loja.json'), 'utf-8'),
);

const prisma = new PrismaClient();

const CATEGORIA_NOMES = {
  limpeza: 'Limpeza',
  descartaveis: 'Descartáveis',
  papelaria: 'Papelaria',
};

// Mesma correspondência marca → arquivo de logo do checklist original
// (assets/brands/checklist-logos-marcas.csv) — todos os 36 PNGs existem no repo e
// foram copiados pra Código-fonte/frontend/public/brands/.
const MARCA_LOGOS = {
  'Nova Clean': 'nova-clean.png',
  Ypê: 'ype.png',
  Tuff: 'tuff.png',
  Limpadua: 'limpadua.png',
  UAU: 'uau.png',
  Urca: 'urca.png',
  Facilita: 'facilita.png',
  Azulim: 'azulim.png',
  Prático: 'pratico.png',
  Veja: 'veja.png',
  Alpes: 'alpes.png',
  Copobras: 'copobras.png',
  Cloral: 'cloral.png',
  Urso: 'urso.png',
  Alumil: 'alumil.png',
  Fort: 'fort.png',
  Limpol: 'limpol.png',
  OMO: 'omo.png',
  BIC: 'bic.png',
  Chamex: 'chamex.png',
  Vitral: 'vitral.png',
  Dac: 'dac.png',
  Downy: 'downy.png',
  'Faber-Castell': 'faber-castell.png',
  Invicto: 'invicto.png',
  Neve: 'neve.png',
  Pritt: 'pritt.png',
  Rolopac: 'rolopac.png',
  'Ruth Care': 'ruth-care.png',
  Santher: 'santher.png',
  Scotch: 'scotch.png',
  Scrity: 'scrity.png',
  Snob: 'snob.png',
  Tilibra: 'tilibra.png',
  Tixan: 'tixan.png',
  Ultralar: 'ultralar.png',
};

// Estoque inicial genérico — os CSVs de origem não têm dado real de estoque,
// só preço/variante. Ajustável depois pelo admin.
const ESTOQUE_INICIAL = 20;

function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const categoriaPorSlug = {};
  for (const [slug, nome] of Object.entries(CATEGORIA_NOMES)) {
    categoriaPorSlug[slug] = await prisma.categoria.upsert({
      where: { slug },
      update: { nome },
      create: { slug, nome },
    });
  }
  console.log(`Categorias: ${Object.keys(categoriaPorSlug).length}`);

  const marcaPorNome = {};
  for (const [nome, arquivo] of Object.entries(MARCA_LOGOS)) {
    marcaPorNome[nome] = await prisma.marca.upsert({
      where: { nome },
      update: { imagemUrl: `/brands/${arquivo}` },
      create: { nome, imagemUrl: `/brands/${arquivo}` },
    });
  }
  console.log(`Marcas: ${Object.keys(marcaPorNome).length}`);

  let totalTipos = 0;
  let totalProdutos = 0;

  for (const tipo of PRODUCT_TYPES) {
    const categoria = categoriaPorSlug[tipo.cat];
    // upsert por slug não cobre a primeira execução pós-migration: linhas criadas
    // antes do campo slug existir já ocupam a unique de categoriaId+nome, então
    // tenta achar por slug OU pelo par antigo antes de decidir criar/atualizar.
    let produtoTipo = await prisma.produtoTipo.findUnique({ where: { slug: tipo.id } });
    if (!produtoTipo) {
      produtoTipo = await prisma.produtoTipo.findFirst({
        where: { categoriaId: categoria.id, nome: tipo.name },
      });
    }
    produtoTipo = produtoTipo
      ? await prisma.produtoTipo.update({
          where: { id: produtoTipo.id },
          data: { slug: tipo.id, categoriaId: categoria.id, nome: tipo.name },
        })
      : await prisma.produtoTipo.create({
          data: { slug: tipo.id, categoriaId: categoria.id, nome: tipo.name },
        });
    totalTipos++;

    for (const variante of tipo.variants) {
      const marca = marcaPorNome[variante.brand];
      if (!marca) {
        console.warn(
          `Marca "${variante.brand}" sem logo mapeado — pulando variante ${variante.id}`,
        );
        continue;
      }

      const slug = `${slugify(`${tipo.name} ${variante.brand} ${variante.pack}`)}-${variante.id}`;

      await prisma.produto.upsert({
        where: { slug },
        update: {
          nome: tipo.name,
          pack: variante.pack,
          preco: variante.price,
          produtoTipoId: produtoTipo.id,
          marcaId: marca.id,
          categoriaId: categoria.id,
          categoria: tipo.cat,
        },
        create: {
          nome: tipo.name,
          pack: variante.pack,
          slug,
          preco: variante.price,
          estoque: ESTOQUE_INICIAL,
          produtoTipoId: produtoTipo.id,
          marcaId: marca.id,
          categoriaId: categoria.id,
          categoria: tipo.cat,
        },
      });
      totalProdutos++;
    }
  }

  console.log(`Tipos de produto: ${totalTipos}`);
  console.log(`Produtos/variantes: ${totalProdutos}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
