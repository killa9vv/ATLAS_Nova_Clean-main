// Fluxo de troca de e-mail contra a API e o banco de verdade. Arquivo próprio porque cada
// teste cria uma conta nova, e /registrar e /login limitam a 5 chamadas por minuto — o
// limitador é desligado só aqui (ThrottlerStorage trocado por um que nunca bloqueia).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';
import { EmailQueuePort } from '../src/emails/domain/email-queue.port';
import { criarContaAtivada, FakeEmailQueue } from './helpers/conta-cliente';

describe('Troca de e-mail do cliente (e2e)', () => {
  let app: INestApplication;
  let fila: FakeEmailQueue;

  beforeAll(async () => {
    fila = new FakeEmailQueue();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailQueuePort)
      .useValue(fila)
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: async () => ({
          totalHits: 1,
          timeToExpire: 60,
          isBlocked: false,
          timeToBlockExpire: 0,
        }),
      })
      .compile();

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
    return `troca-email-${Date.now()}-${contador}@teste.com`;
  }

  const SENHA = 'senha-forte-123';

  async function contaLogada() {
    const email = emailUnico();
    await criarContaAtivada(app, fila, { nome: 'Ana Lima', email, senha: SENHA });
    const login = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: SENHA })
      .expect(201);
    return {
      email,
      accessToken: login.body.accessToken as string,
      refreshToken: login.body.refreshToken as string,
    };
  }

  const pedirTroca = (accessToken: string, novoEmail: string, senhaAtual = SENHA) =>
    request(app.getHttpServer())
      .post('/clientes/me/email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ novoEmail, senhaAtual });

  const confirmar = (token: string) =>
    request(app.getHttpServer()).post('/auth/clientes/confirmar-troca-email').send({ token });

  it('PATCH /clientes/me não aceita mais trocar o e-mail direto', async () => {
    const { accessToken, email } = await contaLogada();

    await request(app.getHttpServer())
      .patch('/clientes/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: emailUnico() })
      .expect(400);

    const perfil = await request(app.getHttpServer())
      .get('/clientes/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(perfil.body.email).toBe(email);
  });

  it('senha errada responde 403 (não 401, que desconectaria o cliente) e não envia nada', async () => {
    const { accessToken } = await contaLogada();
    const novoEmail = emailUnico();

    await pedirTroca(accessToken, novoEmail, 'senha-errada').expect(403);

    expect(fila.tokenPara('CONFIRMACAO_TROCA_EMAIL', novoEmail)).toBeUndefined();
  });

  it('fluxo completo: só muda ao confirmar, derruba as sessões, avisa o antigo e o link não reaproveita', async () => {
    const { accessToken, refreshToken, email } = await contaLogada();
    const novoEmail = emailUnico();

    await pedirTroca(accessToken, novoEmail).expect(200);

    // Antes de confirmar, nada mudou: o login continua com o e-mail antigo.
    await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: SENHA })
      .expect(201);

    const token = fila.tokenPara('CONFIRMACAO_TROCA_EMAIL', novoEmail) as string;
    await confirmar(token).expect(204);

    await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: SENHA })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email: novoEmail, senha: SENHA })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/clientes/refresh')
      .send({ refreshToken })
      .expect(401);
    expect(fila.tarefas).toContainEqual(
      expect.objectContaining({ tipo: 'AVISO_EMAIL_ALTERADO', destinatario: email, novoEmail }),
    );

    await confirmar(token).expect(400);
  });

  it('e-mail de outra conta: pedir não revela nada, e a confirmação recusa', async () => {
    const { accessToken } = await contaLogada();
    const outra = await contaLogada();

    await pedirTroca(accessToken, outra.email).expect(200);
    const token = fila.tokenPara('CONFIRMACAO_TROCA_EMAIL', outra.email) as string;

    await confirmar(token).expect(409);
  });

  it('trocar a senha invalida o link pendente', async () => {
    const { accessToken } = await contaLogada();
    const novoEmail = emailUnico();
    await pedirTroca(accessToken, novoEmail).expect(200);

    await request(app.getHttpServer())
      .patch('/clientes/me/senha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ senhaAtual: SENHA, novaSenha: 'outra-senha-456' })
      .expect(204);

    const token = fila.tokenPara('CONFIRMACAO_TROCA_EMAIL', novoEmail) as string;
    await confirmar(token).expect(400);
  });

  it('o token do link não funciona como access token, e token adulterado é recusado', async () => {
    const { accessToken } = await contaLogada();
    const novoEmail = emailUnico();
    await pedirTroca(accessToken, novoEmail).expect(200);
    const token = fila.tokenPara('CONFIRMACAO_TROCA_EMAIL', novoEmail) as string;

    await request(app.getHttpServer())
      .get('/clientes/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    await confirmar(accessToken).expect(400);
  });
});
