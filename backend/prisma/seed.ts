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

/**
 * Importa o catálogo real direto do site estático (atlas-nova-clean-loja/js/data/products.js)
 * para não duplicar os ~126 produtos à mão. Exige que essa pasta tenha um package.json com
 * "type": "module" para o Node conseguir interpretar o `export const` do arquivo.
 */
async function carregarCatalogoDoSite() {
  const caminho = path.resolve(__dirname, '../../atlas-nova-clean-loja/js/data/products.js');
  const modulo = await importarModuloEsm(pathToFileURL(caminho).href);
  return modulo.PRODUCTS as Array<{ id: string; name: string; brand: string; pack: string; price: number }>;
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
  const produtos = await carregarCatalogoDoSite();
  const slugsUsados = new Set<string>();

  for (const produto of produtos) {
    let slug = gerarSlug(produto.name);
    let tentativa = 1;
    while (slugsUsados.has(slug)) {
      tentativa++;
      slug = `${gerarSlug(produto.name)}-${tentativa}`;
    }
    slugsUsados.add(slug);

    await prisma.produto.upsert({
      where: { id: produto.id },
      update: {
        nome: produto.name,
        descricao: `${produto.brand} — ${produto.pack}`,
        preco: produto.price,
        categoria: produto.brand,
      },
      create: {
        id: produto.id,
        nome: produto.name,
        slug,
        descricao: `${produto.brand} — ${produto.pack}`,
        preco: produto.price,
        estoque: 100,
        categoria: produto.brand,
        ativo: true,
      },
    });
  }

  console.log(`${produtos.length} produtos sincronizados com o catálogo do site.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
