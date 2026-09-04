// Teste e2e do cupom de ponta a ponta contra Postgres real: cupom criado no admin →
// aplicado no cálculo do carrinho → desconto gravado no pedido → uso do cupom só
// incrementa quando o pedido é confirmado como PAGO (mesma invariante do estoque).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Cupom no checkout (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let produtoTipoId: string;
  let marcaId: string;
  let tokenAdmin: string;

  const contatoValido = {
    nome: 'Maria da Silva',
    email: 'maria@example.com',
    telefone: '(22) 99999-8888',
  };

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
    const jwtService = moduleRef.get(JwtService);
    tokenAdmin = jwtService.sign({ sub: randomUUID(), email: 'admin@teste.com', papel: 'ADMIN' });

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

  function criarProdutoComEstoque(estoque: number, preco = 100) {
    return prisma.produto.create({
      data: {
        id: randomUUID(),
        nome: `Produto de teste ${randomUUID()}`,
        slug: `produto-teste-${randomUUID()}`,
        pack: 'unidade',
        preco,
        estoque,
        produtoTipoId,
        marcaId,
      },
    });
  }

  async function criarCupom(overrides: Record<string, unknown> = {}) {
    const codigo = `cupom${randomUUID().slice(0, 8)}`;
    const resposta = await request(app.getHttpServer())
      .post('/cupons')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ codigo, tipoDesconto: 'PERCENTUAL', valor: 10, ...overrides })
      .expect(201);
    return resposta.body.codigo as string;
  }

  it('POST /carrinho/calcular aplica o desconto do cupom sobre o total dos itens', async () => {
    const produto = await criarProdutoComEstoque(5, 100);
    const codigo = await criarCupom({ tipoDesconto: 'PERCENTUAL', valor: 10 });

    const resposta = await request(app.getHttpServer())
      .post('/carrinho/calcular')
      .send({ itens: [{ produtoId: produto.id, quantidade: 1 }], cupomCodigo: codigo })
      .expect(201);

    expect(resposta.body.total).toBe(100);
    expect(resposta.body.desconto).toBe(10);
    expect(resposta.body.totalComDesconto).toBe(90);
    expect(resposta.body.cupomCodigo).toBe(codigo);
  });

  it('POST /carrinho/calcular aceita o código em minúsculo (normaliza igual a criação)', async () => {
    const produto = await criarProdutoComEstoque(5, 100);
    const codigo = await criarCupom({ tipoDesconto: 'PERCENTUAL', valor: 10 });

    const resposta = await request(app.getHttpServer())
      .post('/carrinho/calcular')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        cupomCodigo: codigo.toLowerCase(),
      })
      .expect(201);

    expect(resposta.body.desconto).toBe(10);
  });

  it('POST /carrinho/calcular rejeita cupom inexistente com 409', async () => {
    const produto = await criarProdutoComEstoque(5, 100);

    await request(app.getHttpServer())
      .post('/carrinho/calcular')
      .send({ itens: [{ produtoId: produto.id, quantidade: 1 }], cupomCodigo: 'INEXISTENTE' })
      .expect(409);
  });

  it('POST /pedidos grava desconto e cupomCodigo no pedido, com total já descontado', async () => {
    const produto = await criarProdutoComEstoque(5, 100);
    const codigo = await criarCupom({ tipoDesconto: 'VALOR_FIXO', valor: 15 });

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
        cupomCodigo: codigo,
      })
      .expect(201);

    expect(resposta.body.desconto).toBe(15);
    expect(resposta.body.cupomCodigo).toBe(codigo);
    expect(resposta.body.total).toBe(85);
  });

  it('uso do cupom só incrementa quando o pedido é confirmado como PAGO, e devolve se cancelado depois', async () => {
    const produto = await criarProdutoComEstoque(5, 100);
    const codigo = await criarCupom({ tipoDesconto: 'PERCENTUAL', valor: 10 });

    // canal: whatsapp — só AGUARDANDO_CONTATO pode ser confirmado como PAGO manualmente
    // pelo admin (ver PedidoStateMachine); CRIADO só vira PAGO via sistema de pagamento.
    const criacao = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
        cupomCodigo: codigo,
        canal: 'whatsapp',
      })
      .expect(201);

    const cupomAntes = await prisma.cupom.findUniqueOrThrow({ where: { codigo } });
    expect(cupomAntes.usosCount).toBe(0);

    await request(app.getHttpServer())
      .patch(`/pedidos/${criacao.body.id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'PAGO' })
      .expect(200);

    const cupomDepoisPago = await prisma.cupom.findUniqueOrThrow({ where: { codigo } });
    expect(cupomDepoisPago.usosCount).toBe(1);

    await request(app.getHttpServer())
      .patch(`/pedidos/${criacao.body.id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'CANCELADO' })
      .expect(200);

    const cupomDepoisCancelado = await prisma.cupom.findUniqueOrThrow({ where: { codigo } });
    expect(cupomDepoisCancelado.usosCount).toBe(0);
  });

  it('cupom com usoMaximo atingido é rejeitado no carrinho (409) mesmo com código correto', async () => {
    const produto = await criarProdutoComEstoque(5, 100);
    const codigo = await criarCupom({ usoMaximo: 1 });

    // Esgota o único uso permitido criando e pagando um pedido com esse cupom.
    // canal: whatsapp — só AGUARDANDO_CONTATO pode ser confirmado como PAGO manualmente
    // pelo admin (ver PedidoStateMachine); CRIADO só vira PAGO via sistema de pagamento.
    const criacao = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
        cupomCodigo: codigo,
        canal: 'whatsapp',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/pedidos/${criacao.body.id}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'PAGO' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/carrinho/calcular')
      .send({ itens: [{ produtoId: produto.id, quantidade: 1 }], cupomCodigo: codigo })
      .expect(409);
  });
});
