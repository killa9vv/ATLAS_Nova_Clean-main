// Testes e2e de recuperação de senha contra um Postgres real: solicitar, redefinir
// com o token, confirmar que o token vira inutilizável depois de usado, e que um
// token inválido/expirado é rejeitado. Arquivo separado de clientes-auth.e2e-spec.ts
// só pra manter cada arquivo dentro do orçamento de 5 chamadas/60s de POST
// /auth/clientes/login (esqueci-senha tem o próprio limite separado, por rota).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Recuperação de senha de Cliente (e2e)', () => {
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

  let contador = 0;
  function emailUnico(): string {
    contador += 1;
    return `cliente-reset-${Date.now()}-${contador}@teste.com`;
  }

  // 2 chamadas a /login neste teste.
  it('solicita, redefine com o token, loga com a senha nova, e o mesmo token não pode ser reusado', async () => {
    const email = emailUnico();
    await request(app.getHttpServer())
      .post('/auth/clientes/registrar')
      .send({ nome: 'Ana Paula', email, senha: 'senha-original-789' })
      .expect(201);

    const solicitacao = await request(app.getHttpServer())
      .post('/auth/clientes/esqueci-senha')
      .send({ email })
      .expect(200);
    const token = solicitacao.body.token;
    expect(token).toBeTruthy();

    await request(app.getHttpServer())
      .post('/auth/clientes/redefinir-senha')
      .send({ token, novaSenha: 'senha-redefinida-000' })
      .expect(204);

    const loginComSenhaAntiga = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: 'senha-original-789' });
    expect(loginComSenhaAntiga.status).toBe(401);

    const loginComSenhaNova = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: 'senha-redefinida-000' })
      .expect(201);
    expect(loginComSenhaNova.body.accessToken).toBeTruthy();

    // Token de uso único — tentar de novo com o mesmo token falha, mesmo sendo
    // "válido" antes (já foi consumido).
    const reuso = await request(app.getHttpServer())
      .post('/auth/clientes/redefinir-senha')
      .send({ token, novaSenha: 'outra-senha-111' });
    expect(reuso.status).toBe(400);
    expect(reuso.body.erro).toBe('TOKEN_RECUPERACAO_INVALIDO');
  });

  it('token inexistente/inválido é rejeitado', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/auth/clientes/redefinir-senha')
      .send({ token: 'token-que-nunca-existiu', novaSenha: 'senha-qualquer-123' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('TOKEN_RECUPERACAO_INVALIDO');
  });

  it('e-mail não cadastrado ainda responde 200 sem token — não revela se a conta existe', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/auth/clientes/esqueci-senha')
      .send({ email: 'ninguem-tem-essa-conta@teste.com' })
      .expect(200);

    expect(resposta.body.token).toBeUndefined();
  });

  it('cliente sem senha (só existe do checkout de convidado) também não recebe token', async () => {
    const email = emailUnico();
    await request(app.getHttpServer())
      .post('/clientes')
      .send({ nome: 'Cliente convidado', email })
      .expect(201);

    const resposta = await request(app.getHttpServer())
      .post('/auth/clientes/esqueci-senha')
      .send({ email })
      .expect(200);

    expect(resposta.body.token).toBeUndefined();
  });
});
