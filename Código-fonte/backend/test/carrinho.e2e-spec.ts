// Testes e2e do carrinho persistido: sessão anônima via header X-Cart-Session,
// continuidade pra cliente logado (mesmo carrinho entre "dispositivos" via
// Authorization), adoção do carrinho anônimo ao logar, e disponibilidade na leitura.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Carrinho (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let produtoTipoId: string;
  let marcaId: string;

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

  it('GET /carrinho sem token nenhum devolve carrinho vazio sem criar linha no banco', async () => {
    const antes = await prisma.carrinho.count();

    const resposta = await request(app.getHttpServer()).get('/carrinho').expect(200);

    expect(resposta.body).toMatchObject({ itens: [], itensIndisponiveis: [], total: 0 });
    expect(resposta.body.sessionToken).toBeUndefined();
    expect(await prisma.carrinho.count()).toBe(antes);
  });

  it('POST /carrinho/itens sem header cria um carrinho e devolve sessionToken no corpo e no header', async () => {
    const produto = await criarProdutoComEstoque(10);

    const resposta = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .send({ produtoId: produto.id, quantidade: 2 })
      .expect(201);

    expect(resposta.body.sessionToken).toEqual(expect.any(String));
    expect(resposta.headers['x-cart-session']).toBe(resposta.body.sessionToken);
    expect(resposta.body.itens).toEqual([
      expect.objectContaining({ produtoId: produto.id, quantidade: 2 }),
    ]);
  });

  it('reenviar o mesmo X-Cart-Session em GET /carrinho devolve o mesmo carrinho persistido', async () => {
    const produto = await criarProdutoComEstoque(10);
    const criado = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .send({ produtoId: produto.id, quantidade: 1 })
      .expect(201);
    const sessionToken = criado.body.sessionToken as string;

    const resposta = await request(app.getHttpServer())
      .get('/carrinho')
      .set('X-Cart-Session', sessionToken)
      .expect(200);

    expect(resposta.body.itens).toEqual([
      expect.objectContaining({ produtoId: produto.id, quantidade: 1 }),
    ]);
  });

  it('duas chamadas de POST /carrinho/itens com o mesmo produto somam quantidade, não duplicam linha', async () => {
    const produto = await criarProdutoComEstoque(10);
    const primeira = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .send({ produtoId: produto.id, quantidade: 2 })
      .expect(201);
    const sessionToken = primeira.body.sessionToken as string;

    const segunda = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .set('X-Cart-Session', sessionToken)
      .send({ produtoId: produto.id, quantidade: 3 })
      .expect(201);

    expect(segunda.body.itens).toHaveLength(1);
    expect(segunda.body.itens[0]).toMatchObject({ produtoId: produto.id, quantidade: 5 });
  });

  it('PATCH itens/:produtoId com quantidade 0 remove o item', async () => {
    const produto = await criarProdutoComEstoque(10);
    const criado = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .send({ produtoId: produto.id, quantidade: 2 })
      .expect(201);
    const sessionToken = criado.body.sessionToken as string;

    const resposta = await request(app.getHttpServer())
      .patch(`/carrinho/itens/${produto.id}`)
      .set('X-Cart-Session', sessionToken)
      .send({ quantidade: 0 })
      .expect(200);

    expect(resposta.body.itens).toHaveLength(0);
  });

  it('DELETE itens/:produtoId e DELETE /carrinho limpam o carrinho', async () => {
    const produtoA = await criarProdutoComEstoque(10);
    const produtoB = await criarProdutoComEstoque(10);
    const criado = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .send({ produtoId: produtoA.id, quantidade: 1 })
      .expect(201);
    const sessionToken = criado.body.sessionToken as string;
    await request(app.getHttpServer())
      .post('/carrinho/itens')
      .set('X-Cart-Session', sessionToken)
      .send({ produtoId: produtoB.id, quantidade: 1 })
      .expect(201);

    const aposRemoverUm = await request(app.getHttpServer())
      .delete(`/carrinho/itens/${produtoA.id}`)
      .set('X-Cart-Session', sessionToken)
      .expect(200);
    expect(aposRemoverUm.body.itens).toHaveLength(1);

    const aposLimpar = await request(app.getHttpServer())
      .delete('/carrinho')
      .set('X-Cart-Session', sessionToken)
      .expect(200);
    expect(aposLimpar.body.itens).toHaveLength(0);
  });

  it('cliente autenticado sem X-Cart-Session: carrinho persiste entre chamadas (mesmo Bearer, "outro dispositivo")', async () => {
    const cliente = await criarClienteComToken();
    const produto = await criarProdutoComEstoque(10);

    const primeiraChamada = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .send({ produtoId: produto.id, quantidade: 2 })
      .expect(201);
    expect(primeiraChamada.body.itens).toHaveLength(1);

    // Sem sessionToken nenhum, só o mesmo Bearer — simula abrir em outro dispositivo.
    const segundaChamada = await request(app.getHttpServer())
      .get('/carrinho')
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .expect(200);

    expect(segundaChamada.body.itens).toEqual([
      expect.objectContaining({ produtoId: produto.id, quantidade: 2 }),
    ]);
  });

  it('anônimo adiciona item e depois loga: carrinho anônimo é adotado pelo cliente sem carrinho prévio', async () => {
    const produto = await criarProdutoComEstoque(10);
    const anonimo = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .send({ produtoId: produto.id, quantidade: 3 })
      .expect(201);
    const sessionToken = anonimo.body.sessionToken as string;

    const cliente = await criarClienteComToken();

    const aposLogar = await request(app.getHttpServer())
      .get('/carrinho')
      .set('X-Cart-Session', sessionToken)
      .set('Authorization', `Bearer ${cliente.accessToken}`)
      .expect(200);

    expect(aposLogar.body.itens).toEqual([
      expect.objectContaining({ produtoId: produto.id, quantidade: 3 }),
    ]);

    const carrinhoNoBanco = await prisma.carrinho.findUnique({
      where: { sessionToken },
    });
    expect(carrinhoNoBanco?.clienteId).toBe(cliente.clienteId);
  });

  it('produto desativado depois de adicionado aparece em itensIndisponiveis, sem sumir do banco', async () => {
    const produto = await criarProdutoComEstoque(10);
    const criado = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .send({ produtoId: produto.id, quantidade: 1 })
      .expect(201);
    const sessionToken = criado.body.sessionToken as string;

    await prisma.produto.update({ where: { id: produto.id }, data: { ativo: false } });

    const resposta = await request(app.getHttpServer())
      .get('/carrinho')
      .set('X-Cart-Session', sessionToken)
      .expect(200);

    expect(resposta.body.itens).toHaveLength(0);
    expect(resposta.body.itensIndisponiveis).toEqual([
      { produtoId: produto.id, nome: produto.nome, motivo: 'PRODUTO_INDISPONIVEL' },
    ]);

    const itemNoBanco = await prisma.itemCarrinho.findFirst({ where: { produtoId: produto.id } });
    expect(itemNoBanco).not.toBeNull();
  });
});
