// Teste e2e de ponta a ponta contra Postgres real pros filtros novos de
// GET /produtos: marcaId, precoMin/precoMax, disponivel, e os limites reais de
// preço (precoMinCatalogo/precoMaxCatalogo) devolvidos junto da listagem.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Catálogo: filtros de produtos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let categoriaSlug: string;
  let marcaA: string;
  let marcaB: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);

    categoriaSlug = `categoria-filtro-${randomUUID()}`;
    await prisma.categoria.create({ data: { slug: categoriaSlug, nome: 'Categoria de filtro' } });
    const marcaCriadaA = await prisma.marca.create({
      data: { nome: `Marca filtro A ${randomUUID()}` },
    });
    const marcaCriadaB = await prisma.marca.create({
      data: { nome: `Marca filtro B ${randomUUID()}` },
    });
    marcaA = marcaCriadaA.id;
    marcaB = marcaCriadaB.id;
  });

  afterAll(async () => {
    await app.close();
  });

  function criarProduto(overrides: {
    preco: number;
    estoque: number;
    marcaId?: string;
    categoria?: string;
  }) {
    return prisma.produto.create({
      data: {
        id: randomUUID(),
        nome: `Produto filtro ${randomUUID()}`,
        slug: `produto-filtro-${randomUUID()}`,
        preco: overrides.preco,
        estoque: overrides.estoque,
        marcaId: overrides.marcaId,
        categoria: overrides.categoria,
      },
    });
  }

  it('marcaId filtra só os produtos daquela marca', async () => {
    const produtoA = await criarProduto({ preco: 20, estoque: 5, marcaId: marcaA });
    await criarProduto({ preco: 20, estoque: 5, marcaId: marcaB });

    const resposta = await request(app.getHttpServer())
      .get(`/produtos?pagina=1&limite=200&marcaId=${marcaA}`)
      .expect(200);

    const ids = resposta.body.itens.map((p: { id: string }) => p.id);
    expect(ids).toContain(produtoA.id);
    expect(
      resposta.body.itens.every((p: { marca?: { id: string } }) => p.marca?.id === marcaA),
    ).toBe(true);
  });

  it('categorias/marcaIds (plural) combinam com OR entre valores do mesmo filtro', async () => {
    const categoriaExtra = `categoria-extra-${randomUUID()}`;
    const doGrupo1 = await criarProduto({ preco: 20, estoque: 5, categoria: categoriaSlug });
    const doGrupo2 = await criarProduto({ preco: 20, estoque: 5, categoria: categoriaExtra });
    await criarProduto({ preco: 20, estoque: 5, categoria: 'categoria-nenhuma-relacao' });

    const resposta = await request(app.getHttpServer())
      .get(`/produtos?pagina=1&limite=200&categorias=${categoriaSlug}&categorias=${categoriaExtra}`)
      .expect(200);

    const ids = resposta.body.itens.map((p: { id: string }) => p.id);
    expect(ids).toEqual(expect.arrayContaining([doGrupo1.id, doGrupo2.id]));
    expect(ids).toHaveLength(2);
  });

  it('precoMin/precoMax filtram por faixa (inclusive nos dois limites)', async () => {
    const barato = await criarProduto({ preco: 10, estoque: 5 });
    const meio = await criarProduto({ preco: 50, estoque: 5 });
    const caro = await criarProduto({ preco: 200, estoque: 5 });

    const resposta = await request(app.getHttpServer())
      .get('/produtos?pagina=1&limite=200&precoMin=10&precoMax=50')
      .expect(200);

    const ids = resposta.body.itens.map((p: { id: string }) => p.id);
    expect(ids).toContain(barato.id);
    expect(ids).toContain(meio.id);
    expect(ids).not.toContain(caro.id);
  });

  it('disponivel=true só devolve produtos com estoque > 0', async () => {
    const comEstoque = await criarProduto({ preco: 30, estoque: 3 });
    const semEstoque = await criarProduto({ preco: 30, estoque: 0 });

    const resposta = await request(app.getHttpServer())
      .get('/produtos?pagina=1&limite=200&disponivel=true')
      .expect(200);

    const ids = resposta.body.itens.map((p: { id: string }) => p.id);
    expect(ids).toContain(comEstoque.id);
    expect(ids).not.toContain(semEstoque.id);
  });

  it('filtros combinados (categoria + marca + faixa de preço) aplicam AND entre si', async () => {
    const bate = await criarProduto({
      preco: 40,
      estoque: 5,
      marcaId: marcaA,
      categoria: categoriaSlug,
    });
    // Mesma marca e preço, categoria diferente — não deve aparecer.
    await criarProduto({ preco: 40, estoque: 5, marcaId: marcaA, categoria: 'outra-categoria' });
    // Mesma categoria e preço, marca diferente — não deve aparecer.
    await criarProduto({
      preco: 40,
      estoque: 5,
      marcaId: marcaB,
      categoria: categoriaSlug,
    });

    const resposta = await request(app.getHttpServer())
      .get(
        `/produtos?pagina=1&limite=200&categoria=${categoriaSlug}&marcaId=${marcaA}&precoMin=30&precoMax=50`,
      )
      .expect(200);

    const ids = resposta.body.itens.map((p: { id: string }) => p.id);
    expect(ids).toEqual([bate.id]);
  });

  it('precoMinCatalogo/precoMaxCatalogo refletem a faixa real do recorte, ignorando o próprio filtro de preço', async () => {
    const marcaIsolada = await prisma.marca.create({
      data: { nome: `Marca isolada ${randomUUID()}` },
    });
    await criarProduto({ preco: 15, estoque: 5, marcaId: marcaIsolada.id });
    await criarProduto({ preco: 90, estoque: 5, marcaId: marcaIsolada.id });

    // Mesmo filtrando um recorte estreito de preço (30-40, que não bate com
    // nenhum dos dois produtos acima), os limites do catálogo devolvidos
    // continuam refletindo o recorte por marca (15 a 90), não o filtro de preço.
    const resposta = await request(app.getHttpServer())
      .get(`/produtos?pagina=1&limite=200&marcaId=${marcaIsolada.id}&precoMin=30&precoMax=40`)
      .expect(200);

    expect(resposta.body.itens).toHaveLength(0);
    expect(resposta.body.precoMinCatalogo).toBe(15);
    expect(resposta.body.precoMaxCatalogo).toBe(90);
  });
  it('fotoPrimeiro=true põe quem tem foto antes, mantendo a ordenação pedida em cada grupo', async () => {
    const categoria = `categoria-foto-${randomUUID()}`;
    await prisma.categoria.create({ data: { slug: categoria, nome: 'Categoria de foto' } });
    const criar = (dia: number) =>
      prisma.produto.create({
        data: {
          id: randomUUID(),
          nome: `Produto foto ${randomUUID()}`,
          slug: `produto-foto-${randomUUID()}`,
          preco: 10,
          estoque: 5,
          categoria,
          createdAt: new Date(Date.UTC(2026, 0, dia)),
        },
      });
    const novoSemFoto = await criar(30);
    const medioComFoto = await criar(20);
    const velhoComFoto = await criar(10);
    const velhoSemFoto = await criar(5);
    for (const produto of [medioComFoto, velhoComFoto]) {
      await prisma.imagemProduto.create({
        data: { produtoId: produto.id, url: 'https://exemplo.com/f.png', providerId: randomUUID() },
      });
    }

    const comFoto = await request(app.getHttpServer())
      .get(`/produtos?pagina=1&limite=10&categoria=${categoria}&fotoPrimeiro=true`)
      .expect(200);
    expect(comFoto.body.itens.map((p: { id: string }) => p.id)).toEqual([
      medioComFoto.id,
      velhoComFoto.id,
      novoSemFoto.id,
      velhoSemFoto.id,
    ]);
    expect(comFoto.body.total).toBe(4);

    const semParametro = await request(app.getHttpServer())
      .get(`/produtos?pagina=1&limite=10&categoria=${categoria}`)
      .expect(200);
    expect(semParametro.body.itens.map((p: { id: string }) => p.id)).toEqual([
      novoSemFoto.id,
      medioComFoto.id,
      velhoComFoto.id,
      velhoSemFoto.id,
    ]);
  });
});
