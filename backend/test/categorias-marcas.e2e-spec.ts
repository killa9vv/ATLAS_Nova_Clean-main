// Teste e2e de categorias/marcas contra Postgres real: cobre o fluxo de CRUD completo
// e, principalmente, a proteção contra exclusão de categoria/marca com produtos
// vinculados (a garantia mais fácil de quebrar silenciosamente numa reescrita futura).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Categorias e Marcas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenAdmin: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Categorias', () => {
    it('rejeita criar sem token (401)', async () => {
      await request(app.getHttpServer())
        .post('/categorias')
        .send({ nome: 'Categoria sem auth' })
        .expect(401);
    });

    it('cria, lista, atualiza e exclui uma categoria', async () => {
      const nome = `Categoria de teste ${randomUUID()}`;

      const respostaCriacao = await request(app.getHttpServer())
        .post('/categorias')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome })
        .expect(201);

      expect(respostaCriacao.body.nome).toBe(nome);
      expect(respostaCriacao.body.slug).toBeTruthy();
      const id = respostaCriacao.body.id;

      const respostaListagem = await request(app.getHttpServer()).get('/categorias').expect(200);
      expect(respostaListagem.body.some((categoria: { id: string }) => categoria.id === id)).toBe(
        true,
      );

      const novoNome = `${nome} (atualizada)`;
      const respostaAtualizacao = await request(app.getHttpServer())
        .put(`/categorias/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: novoNome })
        .expect(200);
      expect(respostaAtualizacao.body.nome).toBe(novoNome);
      // Slug não muda com o nome — evita quebrar links já em uso.
      expect(respostaAtualizacao.body.slug).toBe(respostaCriacao.body.slug);

      await request(app.getHttpServer())
        .delete(`/categorias/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);
    });

    it('não permite excluir categoria com produto vinculado (409)', async () => {
      const categoria = await prisma.categoria.create({
        data: { slug: `categoria-vinculada-${randomUUID()}`, nome: 'Categoria vinculada' },
      });
      await prisma.produto.create({
        data: {
          id: randomUUID(),
          nome: `Produto vinculado ${randomUUID()}`,
          slug: `produto-vinculado-${randomUUID()}`,
          preco: 10,
          estoque: 1,
          categoriaId: categoria.id,
        },
      });

      const resposta = await request(app.getHttpServer())
        .delete(`/categorias/${categoria.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(409);

      expect(resposta.body.erro).toBe('CATEGORIA_COM_PRODUTOS_VINCULADOS');
    });
  });

  describe('Marcas', () => {
    it('cria, lista, atualiza e exclui uma marca', async () => {
      const nome = `Marca de teste ${randomUUID()}`;

      const respostaCriacao = await request(app.getHttpServer())
        .post('/marcas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome })
        .expect(201);
      const id = respostaCriacao.body.id;

      const respostaListagem = await request(app.getHttpServer()).get('/marcas').expect(200);
      expect(respostaListagem.body.some((marca: { id: string }) => marca.id === id)).toBe(true);

      const novoNome = `${nome} (atualizada)`;
      await request(app.getHttpServer())
        .put(`/marcas/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome: novoNome })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/marcas/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);
    });

    it('rejeita criar marca com nome duplicado (409)', async () => {
      const nome = `Marca duplicada ${randomUUID()}`;
      await request(app.getHttpServer())
        .post('/marcas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome })
        .expect(201);

      const resposta = await request(app.getHttpServer())
        .post('/marcas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nome })
        .expect(409);

      expect(resposta.body.erro).toBe('MARCA_DUPLICADA');
    });

    it('não permite excluir marca com produto vinculado (409)', async () => {
      const marca = await prisma.marca.create({
        data: { nome: `Marca vinculada ${randomUUID()}` },
      });
      await prisma.produto.create({
        data: {
          id: randomUUID(),
          nome: `Produto com marca ${randomUUID()}`,
          slug: `produto-com-marca-${randomUUID()}`,
          preco: 10,
          estoque: 1,
          marcaId: marca.id,
        },
      });

      const resposta = await request(app.getHttpServer())
        .delete(`/marcas/${marca.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(409);

      expect(resposta.body.erro).toBe('MARCA_COM_PRODUTOS_VINCULADOS');
    });
  });
});
