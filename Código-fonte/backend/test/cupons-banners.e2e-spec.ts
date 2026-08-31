// Teste e2e de cupons/banners contra Postgres real: cobre CRUD completo e,
// principalmente, o gate admin-only (401 sem token, 403 com token de cliente)
// e a proteção contra código de cupom duplicado.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Cupons e Banners (e2e)', () => {
  let app: INestApplication;
  let tokenAdmin: string;
  let tokenCliente: string;

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

    const jwtService = moduleRef.get(JwtService);
    tokenAdmin = jwtService.sign({ sub: randomUUID(), email: 'admin@teste.com', papel: 'ADMIN' });
    tokenCliente = jwtService.sign({
      sub: randomUUID(),
      email: 'cliente@teste.com',
      papel: 'CLIENTE',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cupons', () => {
    it('rejeita listar sem token (401)', async () => {
      await request(app.getHttpServer()).get('/cupons').expect(401);
    });

    it('rejeita listar com token de cliente (403)', async () => {
      await request(app.getHttpServer())
        .get('/cupons')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(403);
    });

    it('cria, lista e atualiza um cupom', async () => {
      const codigo = `promo${randomUUID().slice(0, 8)}`;

      const respostaCriacao = await request(app.getHttpServer())
        .post('/cupons')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ codigo, tipoDesconto: 'PERCENTUAL', valor: 15 })
        .expect(201);

      // Código normalizado pra maiúsculo.
      expect(respostaCriacao.body.codigo).toBe(codigo.toUpperCase());
      const id = respostaCriacao.body.id;

      const respostaListagem = await request(app.getHttpServer())
        .get('/cupons')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(respostaListagem.body.some((cupom: { id: string }) => cupom.id === id)).toBe(true);

      const respostaAtualizacao = await request(app.getHttpServer())
        .put(`/cupons/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ativo: false })
        .expect(200);
      expect(respostaAtualizacao.body.ativo).toBe(false);
      // Código não é editável — deve permanecer o mesmo.
      expect(respostaAtualizacao.body.codigo).toBe(codigo.toUpperCase());
    });

    it('rejeita criar cupom com código duplicado (409)', async () => {
      const codigo = `dup${randomUUID().slice(0, 8)}`;
      await request(app.getHttpServer())
        .post('/cupons')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ codigo, tipoDesconto: 'VALOR_FIXO', valor: 20 })
        .expect(201);

      const resposta = await request(app.getHttpServer())
        .post('/cupons')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ codigo: codigo.toLowerCase(), tipoDesconto: 'VALOR_FIXO', valor: 20 })
        .expect(409);

      expect(resposta.body.erro).toBe('CUPOM_CODIGO_DUPLICADO');
    });

    it('retorna 404 ao atualizar cupom inexistente', async () => {
      const resposta = await request(app.getHttpServer())
        .put(`/cupons/${randomUUID()}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ativo: false })
        .expect(404);

      expect(resposta.body.erro).toBe('CUPOM_NAO_ENCONTRADO');
    });
  });

  describe('Banners', () => {
    it('rejeita listar sem token (401)', async () => {
      await request(app.getHttpServer()).get('/banners').expect(401);
    });

    it('rejeita listar com token de cliente (403)', async () => {
      await request(app.getHttpServer())
        .get('/banners')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .expect(403);
    });

    it('cria, lista, atualiza e exclui um banner', async () => {
      const titulo = `Banner de teste ${randomUUID()}`;

      const respostaCriacao = await request(app.getHttpServer())
        .post('/banners')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ titulo, ordem: 1 })
        .expect(201);

      expect(respostaCriacao.body.titulo).toBe(titulo);
      expect(respostaCriacao.body.ativo).toBe(true);
      const id = respostaCriacao.body.id;

      const respostaListagem = await request(app.getHttpServer())
        .get('/banners')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
      expect(respostaListagem.body.some((banner: { id: string }) => banner.id === id)).toBe(true);

      const novoTitulo = `${titulo} (atualizado)`;
      const respostaAtualizacao = await request(app.getHttpServer())
        .put(`/banners/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ titulo: novoTitulo, ativo: false })
        .expect(200);
      expect(respostaAtualizacao.body.titulo).toBe(novoTitulo);
      expect(respostaAtualizacao.body.ativo).toBe(false);

      await request(app.getHttpServer())
        .delete(`/banners/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);

      const resposta = await request(app.getHttpServer())
        .put(`/banners/${id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ativo: true })
        .expect(404);
      expect(resposta.body.erro).toBe('BANNER_NAO_ENCONTRADO');
    });

    it('retorna 404 ao excluir banner inexistente', async () => {
      const resposta = await request(app.getHttpServer())
        .delete(`/banners/${randomUUID()}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);

      expect(resposta.body.erro).toBe('BANNER_NAO_ENCONTRADO');
    });
  });
});
