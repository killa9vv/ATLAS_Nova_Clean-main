// Testes e2e de "meus pedidos" (listagem, detalhe, rastreio, repetir pedido) contra
// um Postgres real. Token de Cliente é assinado direto via JwtService — mesmo
// padrão já usado em pedidos.e2e-spec.ts pro token de ADMIN — porque esses testes
// não são sobre o fluxo de login em si (isso é clientes-auth.e2e-spec.ts), só
// precisam de um Cliente autenticado válido pra exercitar a autorização e as
// regras de negócio das rotas.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Meus Pedidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let produtoTipoId: string;
  let marcaId: string;

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
    jwtService = moduleRef.get(JwtService);

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

  async function criarClienteComToken() {
    const cliente = await prisma.cliente.create({
      data: { nome: 'Cliente de teste', email: `cliente-${randomUUID()}@teste.com` },
    });
    const accessToken = jwtService.sign(
      { sub: cliente.id, email: cliente.email, papel: 'CLIENTE' },
      { expiresIn: '1h' },
    );
    return { clienteId: cliente.id, accessToken };
  }

  function criarProdutoComEstoque(estoque: number, ativo = true) {
    return prisma.produto.create({
      data: {
        id: randomUUID(),
        nome: `Produto de teste ${randomUUID()}`,
        slug: `produto-teste-${randomUUID()}`,
        pack: 'unidade',
        preco: 10,
        estoque,
        ativo,
        produtoTipoId,
        marcaId,
      },
    });
  }

  async function criarPedidoDoCliente(clienteId: string, produtoId: string, quantidade: number) {
    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId, quantidade }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
        clienteId,
      })
      .expect(201);
    return resposta.body.id as string;
  }

  it('lista só os pedidos do próprio cliente, paginado', async () => {
    const cliente = await criarClienteComToken();
    const outroCliente = await criarClienteComToken();

    const produto = await criarProdutoComEstoque(20);
    await criarPedidoDoCliente(cliente.clienteId, produto.id, 1);
    await criarPedidoDoCliente(cliente.clienteId, produto.id, 1);
    await criarPedidoDoCliente(outroCliente.clienteId, produto.id, 1);

    const resposta = await request(app.getHttpServer())
      .get('/clientes/me/pedidos')
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .expect(200);

    expect(resposta.body.total).toBe(2);
    expect(resposta.body.itens).toHaveLength(2);
    expect(
      resposta.body.itens.every((p: { clienteId: string }) => p.clienteId === cliente.clienteId),
    ).toBe(true);
  });

  it('sem token, GET /clientes/me/pedidos responde 401', async () => {
    const resposta = await request(app.getHttpServer()).get('/clientes/me/pedidos');
    expect(resposta.status).toBe(401);
  });

  it('não permite ver o detalhe/rastreio de um pedido de outro cliente (404, não revela que existe)', async () => {
    const dono = await criarClienteComToken();
    const outro = await criarClienteComToken();
    const produto = await criarProdutoComEstoque(20);
    const pedidoId = await criarPedidoDoCliente(dono.clienteId, produto.id, 1);

    const detalhe = await request(app.getHttpServer())
      .get(`/clientes/me/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${outro.accessToken}`);
    expect(detalhe.status).toBe(404);
    expect(detalhe.body.erro).toBe('PEDIDO_NAO_ENCONTRADO');

    const rastreio = await request(app.getHttpServer())
      .get(`/clientes/me/pedidos/${pedidoId}/rastreio`)
      .set('Authorization', `Bearer ${outro.accessToken}`);
    expect(rastreio.status).toBe(404);
  });

  it('rastreio traz o histórico de status, escrito automaticamente a cada transição', async () => {
    const cliente = await criarClienteComToken();
    const produto = await criarProdutoComEstoque(20);
    const pedidoId = await criarPedidoDoCliente(cliente.clienteId, produto.id, 1);

    const tokenAdmin = jwtService.sign({
      sub: randomUUID(),
      email: 'admin@teste.com',
      papel: 'ADMIN',
    });
    await request(app.getHttpServer())
      .patch(`/pedidos/${pedidoId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'CANCELADO' })
      .expect(200);

    const rastreio = await request(app.getHttpServer())
      .get(`/clientes/me/pedidos/${pedidoId}/rastreio`)
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .expect(200);

    expect(rastreio.body.status).toBe('CANCELADO');
    expect(rastreio.body.historico.length).toBeGreaterThanOrEqual(1);
    expect(rastreio.body.historico[0]).toMatchObject({
      statusAnterior: 'CRIADO',
      statusNovo: 'CANCELADO',
    });
  });

  it('repetir pedido: produto ainda disponível entra normal, com preço atual', async () => {
    const cliente = await criarClienteComToken();
    const produto = await criarProdutoComEstoque(20);
    const pedidoId = await criarPedidoDoCliente(cliente.clienteId, produto.id, 2);

    const resposta = await request(app.getHttpServer())
      .post(`/clientes/me/pedidos/${pedidoId}/repetir`)
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .expect(201);

    expect(resposta.body.itens).toHaveLength(1);
    expect(resposta.body.itens[0]).toMatchObject({
      produtoId: produto.id,
      quantidade: 2,
      precoUnitario: 10,
      ajustado: false,
    });
    expect(resposta.body.itensIndisponiveis).toHaveLength(0);
  });

  it('repetir pedido: produto desativado depois da compra entra em itensIndisponiveis', async () => {
    const cliente = await criarClienteComToken();
    const produto = await criarProdutoComEstoque(20);
    const pedidoId = await criarPedidoDoCliente(cliente.clienteId, produto.id, 1);

    await prisma.produto.update({ where: { id: produto.id }, data: { ativo: false } });

    const resposta = await request(app.getHttpServer())
      .post(`/clientes/me/pedidos/${pedidoId}/repetir`)
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .expect(201);

    expect(resposta.body.itens).toHaveLength(0);
    expect(resposta.body.itensIndisponiveis).toEqual([
      { produtoId: produto.id, nome: expect.any(String), motivo: 'PRODUTO_INDISPONIVEL' },
    ]);
  });

  it('repetir pedido: estoque reduzido depois da compra ajusta a quantidade em vez de bloquear', async () => {
    const cliente = await criarClienteComToken();
    const produto = await criarProdutoComEstoque(20);
    const pedidoId = await criarPedidoDoCliente(cliente.clienteId, produto.id, 5);

    // Estoque caiu pra menos do que foi comprado da última vez.
    await prisma.produto.update({ where: { id: produto.id }, data: { estoque: 2 } });

    const resposta = await request(app.getHttpServer())
      .post(`/clientes/me/pedidos/${pedidoId}/repetir`)
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .expect(201);

    expect(resposta.body.itens).toHaveLength(1);
    expect(resposta.body.itens[0]).toMatchObject({
      produtoId: produto.id,
      quantidade: 2,
      ajustado: true,
    });
  });
});
