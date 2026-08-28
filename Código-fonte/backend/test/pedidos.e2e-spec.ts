import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';
import { ShippingProvider } from '../src/shipping/domain/shipping.types';

describe('Pedidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let produtoTipoId: string;
  let marcaId: string;

  const cepOrigem = '01001000';
  const cepDestino = '20040002';

  const shippingProviderFake: ShippingProvider = {
    cotar: jest.fn().mockResolvedValue({
      valor: 12,
      prazoDias: 5,
      servico: 'Frete E2E',
    }),
  };

  beforeAll(async () => {
    const configServiceFake = {
      get: jest.fn((chave: string) => {
        if (chave === 'CEP_ORIGEM') {
          return cepOrigem;
        }

        return undefined;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ShippingProvider)
      .useValue(shippingProviderFake)
      .overrideProvider(ConfigService)
      .useValue(configServiceFake)
      .compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);

    const categoria = await prisma.categoria.create({
      data: {
        slug: `categoria-teste-${randomUUID()}`,
        nome: 'Categoria de teste',
      },
    });

    const marca = await prisma.marca.create({
      data: {
        nome: `Marca de teste ${randomUUID()}`,
      },
    });

    const produtoTipo = await prisma.produtoTipo.create({
      data: {
        categoriaId: categoria.id,
        nome: `Tipo de teste ${randomUUID()}`,
      },
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
        pesoKg: 1,
        alturaCm: 10,
        larguraCm: 10,
        comprimentoCm: 10,
      },
    });
  }

  it('cria o pedido sem reservar estoque e persiste o frete rateado', async () => {
    const produto = await criarProdutoComEstoque(5);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 2 }],
        cepDestino,
      })
      .expect(201);

    expect(resposta.body.itens).toHaveLength(1);
    expect(resposta.body.total).toBe(20);
    expect(resposta.body.freteTotal).toBe(12);
    expect(resposta.body.itens[0].freteRateado).toBe(12);

    const pedidoPersistido = await prisma.pedido.findUniqueOrThrow({
      where: { id: resposta.body.id },
      include: { itens: true },
    });

    expect(Number(pedidoPersistido.freteTotal)).toBe(12);
    expect(Number(pedidoPersistido.itens[0].freteRateado)).toBe(12);

    const produtoInalterado = await prisma.produto.findUniqueOrThrow({
      where: { id: produto.id },
    });

    expect(produtoInalterado.estoque).toBe(5);
  });

  it('rejeita o pedido quando a quantidade excede o estoque disponível no momento da leitura (409)', async () => {
    const produto = await criarProdutoComEstoque(1);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 5 }],
        cepDestino,
      })
      .expect(409);

    expect(resposta.body.erro).toBe('ESTOQUE_INSUFICIENTE');

    const produtoInalterado = await prisma.produto.findUniqueOrThrow({
      where: { id: produto.id },
    });

    expect(produtoInalterado.estoque).toBe(1);
  });

  it('rejeita corpo inválido com 400 (pedido sem nenhum item)', async () => {
    await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [],
        cepDestino,
      })
      .expect(400);
  });

  it('rejeita pedido sem CEP de destino com 400', async () => {
    const produto = await criarProdutoComEstoque(5);

    await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
      })
      .expect(400);
  });

  it('registra o pedido em AGUARDANDO_CONTATO quando o canal é whatsapp', async () => {
    const produto = await criarProdutoComEstoque(5);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        canal: 'whatsapp',
        cepDestino,
      })
      .expect(201);

    expect(resposta.body.status).toBe('AGUARDANDO_CONTATO');
    expect(resposta.body.freteTotal).toBe(12);
  });

  it('sem canal informado, o pedido usa o default CRIADO', async () => {
    const produto = await criarProdutoComEstoque(5);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        cepDestino,
      })
      .expect(201);

    expect(resposta.body.status).toBe('CRIADO');
    expect(resposta.body.freteTotal).toBe(12);
  });

  it('dois pedidos concorrentes pelo último item podem ser criados ao mesmo tempo sem reservar estoque', async () => {
    const produto = await criarProdutoComEstoque(1);

    const [respostaA, respostaB] = await Promise.all([
      request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          cepDestino,
        }),
      request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          cepDestino,
        }),
    ]);

    expect([respostaA.status, respostaB.status]).toEqual([201, 201]);

    const produtoFinal = await prisma.produto.findUniqueOrThrow({
      where: { id: produto.id },
    });

    expect(produtoFinal.estoque).toBe(1);
  });
});
