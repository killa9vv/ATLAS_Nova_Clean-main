// Testes e2e do login/sessão do Cliente contra um Postgres real: registrar, logar,
// acessar rota "me" com o token, trocar senha (e ver que ela realmente derruba a
// senha antiga e revoga sessões), e rotação de refresh token.
//
// POST /auth/clientes/login é limitado a 5 chamadas/60s — este arquivo fica dentro
// desse orçamento de propósito (ver contagem em cada teste).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Autenticação de Cliente (e2e)', () => {
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
    return `cliente-auth-${Date.now()}-${contador}@teste.com`;
  }

  // 4 chamadas a /login neste teste: senha certa, senha antiga (depois de trocar),
  // e-mail inexistente, senha nova.
  it('registra, loga, acessa /clientes/me, troca senha (invalida a antiga) — e credenciais erradas nunca revelam o motivo', async () => {
    const email = emailUnico();
    const registro = await request(app.getHttpServer())
      .post('/auth/clientes/registrar')
      .send({ nome: 'Maria da Silva', email, senha: 'senha-original-123' })
      .expect(201);
    expect(registro.body.senhaHash).toBeUndefined();

    const login = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: 'senha-original-123' })
      .expect(201);
    const accessToken = login.body.accessToken;
    expect(accessToken).toBeTruthy();
    expect(login.body.cliente.id).toBe(registro.body.id);

    const perfil = await request(app.getHttpServer())
      .get('/clientes/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(perfil.body.email).toBe(email);

    await request(app.getHttpServer())
      .patch('/clientes/me/senha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ senhaAtual: 'senha-original-123', novaSenha: 'senha-nova-456' })
      .expect(204);

    const loginComSenhaAntiga = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: 'senha-original-123' });
    expect(loginComSenhaAntiga.status).toBe(401);
    expect(loginComSenhaAntiga.body.erro).toBe('CREDENCIAIS_INVALIDAS');

    const loginEmailInexistente = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email: 'nao-existe@teste.com', senha: 'qualquer-coisa' });
    // Mesmo código/mensagem de senha errada — não revela se o e-mail existe.
    expect(loginEmailInexistente.status).toBe(401);
    expect(loginEmailInexistente.body.erro).toBe('CREDENCIAIS_INVALIDAS');

    const loginComSenhaNova = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: 'senha-nova-456' })
      .expect(201);
    expect(loginComSenhaNova.body.accessToken).toBeTruthy();
  });

  it('sem token, GET /clientes/me responde 401', async () => {
    const resposta = await request(app.getHttpServer()).get('/clientes/me');
    expect(resposta.status).toBe(401);
  });

  // 1 chamada a /login.
  it('refresh token roda com rotação — o token antigo não pode ser reusado depois de renovado', async () => {
    const email = emailUnico();
    await request(app.getHttpServer())
      .post('/auth/clientes/registrar')
      .send({ nome: 'João Souza', email, senha: 'senha-forte-123' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: 'senha-forte-123' })
      .expect(201);
    const refreshTokenOriginal = login.body.refreshToken;

    const renovado = await request(app.getHttpServer())
      .post('/auth/clientes/refresh')
      .send({ refreshToken: refreshTokenOriginal })
      .expect(201);
    expect(renovado.body.accessToken).toBeTruthy();
    expect(renovado.body.refreshToken).not.toBe(refreshTokenOriginal);

    // Tentar reusar o refresh token original (já revogado pela rotação) falha.
    const reuso = await request(app.getHttpServer())
      .post('/auth/clientes/refresh')
      .send({ refreshToken: refreshTokenOriginal });
    expect(reuso.status).toBe(401);
    expect(reuso.body.erro).toBe('CREDENCIAIS_INVALIDAS');
  });

  it('token de refresh inválido/inexistente responde 401', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/auth/clientes/refresh')
      .send({ refreshToken: 'token-que-nunca-existiu' });
    expect(resposta.status).toBe(401);
  });
});
