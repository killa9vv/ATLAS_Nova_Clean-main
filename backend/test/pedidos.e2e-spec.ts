// Teste e2e do fluxo de criação de pedido contra um Postgres real: prova a
// garantia mais importante do módulo — duas compras concorrentes pelo último
// item em estoque não podem vender as duas. Isso não dá pra provar só com
// mocks (testes unitários), porque depende do comportamento real de locking
// de linha do Postgres sob o UPDATE condicional em
// PrismaProdutoRepository.decrementarEstoque.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Pedidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let produtoTipoId: string;
  let marcaId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Replica o bootstrap real de src/main.ts, pra exercitar o mesmo comportamento
    // de validação/erro que roda em produção.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);

    // Produto agora exige categoria/marca/tipo — cria essa base uma única vez
    // e reutiliza em todo o arquivo, já que os testes só se importam com estoque.
    const categoria = await prisma.categoria.create({
      data: { slug: `categoria-teste-${randomUUID()}`, nome: 'Categoria de teste' },
    });
    const marca = await prisma.marca.create({ data: { nome: `Marca de teste ${randomUUID()}` } });
    const produtoTipo = await prisma.produtoTipo.create({
      data: { categoriaId: categoria.id, nome: `Tipo de teste ${randomUUID()}` },
    });
    produtoTipoId = produtoTipo.id;
    marcaId = marca.id;
  });

  afterAll(async () => {
    await app.close();
  });

  function criarProdutoComEstoque(estoque: number) {
    return prisma.produto.create({
      data: {
        id: randomUUID(),
        nome: `Produto de teste ${randomUUID()}`,
        slug: `produto-teste-${randomUUID()}`,
        pack: 'unidade',
        preco: 10,
        estoque,
        produtoTipoId,
        marcaId,
      },
    });
  }

  it('cria o pedido e decrementa o estoque do produto', async () => {
    const produto = await criarProdutoComEstoque(5);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({ itens: [{ produtoId: produto.id, quantidade: 2 }] })
      .expect(201);

    expect(resposta.body.itens).toHaveLength(1);
    expect(resposta.body.total).toBe(20);

    const produtoAtualizado = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    expect(produtoAtualizado.estoque).toBe(3);
  });

  it('rejeita o pedido quando a quantidade excede o estoque disponível (409)', async () => {
    const produto = await criarProdutoComEstoque(1);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({ itens: [{ produtoId: produto.id, quantidade: 5 }] })
      .expect(409);

    expect(resposta.body.erro).toBe('ESTOQUE_INSUFICIENTE');

    const produtoInalterado = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    expect(produtoInalterado.estoque).toBe(1);
  });

  it('rejeita corpo inválido com 400 (pedido sem nenhum item)', async () => {
    await request(app.getHttpServer()).post('/pedidos').send({ itens: [] }).expect(400);
  });

  it('não vende o mesmo último item duas vezes sob concorrência', async () => {
    const produto = await criarProdutoComEstoque(1);

    const [respostaA, respostaB] = await Promise.all([
      request(app.getHttpServer())
        .post('/pedidos')
        .send({ itens: [{ produtoId: produto.id, quantidade: 1 }] }),
      request(app.getHttpServer())
        .post('/pedidos')
        .send({ itens: [{ produtoId: produto.id, quantidade: 1 }] }),
    ]);

    const statusCodes = [respostaA.status, respostaB.status].sort();
    expect(statusCodes).toEqual([201, 409]);

    const produtoFinal = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    expect(produtoFinal.estoque).toBe(0);
  });
});
