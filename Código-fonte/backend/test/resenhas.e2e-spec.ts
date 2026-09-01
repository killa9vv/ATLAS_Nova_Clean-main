// Teste e2e de resenhas contra Postgres real: criação e listagem, ambas públicas
// (avaliação da loja, sem login de cliente — mesma lógica de checkout de convidado).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Resenhas (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria e lista uma resenha, mais recente primeiro', async () => {
    const respostaCriacao = await request(app.getHttpServer())
      .post('/resenhas')
      .send({ nome: 'Maria da Silva', nota: 5, comentario: 'Atendimento excelente.' })
      .expect(201);

    expect(respostaCriacao.body.nome).toBe('Maria da Silva');
    expect(respostaCriacao.body.nota).toBe(5);

    const respostaListagem = await request(app.getHttpServer()).get('/resenhas').expect(200);
    expect(
      respostaListagem.body.some((r: { id: string }) => r.id === respostaCriacao.body.id),
    ).toBe(true);
  });

  it('rejeita nota fora do intervalo 1-5 (400)', async () => {
    await request(app.getHttpServer())
      .post('/resenhas')
      .send({ nome: 'Teste', nota: 6, comentario: 'Nota inválida.' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/resenhas')
      .send({ nome: 'Teste', nota: 0, comentario: 'Nota inválida.' })
      .expect(400);
  });

  it('rejeita corpo sem nome/comentario (400)', async () => {
    await request(app.getHttpServer()).post('/resenhas').send({ nota: 5 }).expect(400);
  });
});
