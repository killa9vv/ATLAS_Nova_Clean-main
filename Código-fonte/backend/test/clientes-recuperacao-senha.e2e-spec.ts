// Testes e2e de recuperação de senha contra um Postgres real: solicita, redefine
// com o token, confirma que o token vira inutilizável depois de usado, e que um
// token inválido/expirado é rejeitado. Arquivo separado de clientes-auth.e2e-spec.ts
// só pra manter cada arquivo dentro do orçamento de 5 chamadas/60s de POST
// /auth/clientes/login (esqueci-senha tem o próprio limite separado, por rota).
//
// O token não vai mais no corpo da resposta HTTP (ver clientes-auth.controller.ts) —
// só por e-mail, via fila. Este teste não sobe Redis de verdade (a suíte e2e só
// provisiona um Postgres embarcado, ver test/setup/global-setup.ts), então
// EmailQueuePort é substituído por um fake que captura a tarefa enfileirada — o
// resto do fluxo (registro, banco de tokens, redefinição, login) continua 100%
// real, batendo na API/DB de verdade.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';
import { EmailQueuePort } from '../src/emails/domain/email-queue.port';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { FakeEmailQueue, criarContaAtivada } from './helpers/conta-cliente';

describe('Recuperação de senha de Cliente (e2e)', () => {
  let app: INestApplication;
  let fakeEmailQueue: FakeEmailQueue;
  let prisma: PrismaService;

  beforeAll(async () => {
    fakeEmailQueue = new FakeEmailQueue();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailQueuePort)
      .useValue(fakeEmailQueue)
      .compile();
    prisma = moduleRef.get(PrismaService);

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
  it('solicita, redefine com o token enfileirado pro e-mail, loga com a senha nova, e o mesmo token não pode ser reusado', async () => {
    const email = emailUnico();
    await criarContaAtivada(app, fakeEmailQueue, {
      nome: 'Ana Paula',
      email,
      senha: 'senha-original-789',
    });

    const solicitacao = await request(app.getHttpServer())
      .post('/auth/clientes/esqueci-senha')
      .send({ email })
      .expect(200);
    expect(solicitacao.body).toEqual({
      mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.',
    });

    const token = fakeEmailQueue.tokenPara('RECUPERACAO_SENHA', email);
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

  it('e-mail não cadastrado ainda responde 200 e não enfileira nenhum e-mail — não revela se a conta existe', async () => {
    const antes = fakeEmailQueue.tarefas.length;

    await request(app.getHttpServer())
      .post('/auth/clientes/esqueci-senha')
      .send({ email: 'ninguem-tem-essa-conta@teste.com' })
      .expect(200);

    expect(fakeEmailQueue.tarefas.length).toBe(antes);
  });

  it('cliente sem senha (só existe do checkout de convidado) também não gera token nem enfileira e-mail', async () => {
    const email = emailUnico();
    await request(app.getHttpServer())
      .post('/clientes')
      .send({ nome: 'Cliente convidado', email })
      .expect(201);

    const antes = fakeEmailQueue.tarefas.length;

    await request(app.getHttpServer())
      .post('/auth/clientes/esqueci-senha')
      .send({ email })
      .expect(200);

    expect(fakeEmailQueue.tarefas.length).toBe(antes);
  });

  // 1 chamada a /login.
  it('e-mail com maiúsculas: cadastra em minúsculas e acha a conta em qualquer grafia (inclusive cadastro antigo)', async () => {
    const base = `Maria.Case-${Date.now()}@Teste.com`;
    await criarContaAtivada(app, fakeEmailQueue, {
      nome: 'Maria Case',
      email: base,
      senha: 'senha-forte-123',
    });

    const gravado = await prisma.cliente.findFirst({
      where: { email: { equals: base, mode: 'insensitive' } },
    });
    expect(gravado?.email).toBe(base.toLowerCase());

    await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email: base.toUpperCase(), senha: 'senha-forte-123' })
      .expect(201);

    // Cadastro antigo, gravado com maiúsculas antes da normalização existir.
    const legado = `Legado-${Date.now()}@Teste.com`;
    await prisma.cliente.create({
      data: { nome: 'Cliente Legado', email: legado, senhaHash: 'hash-qualquer' },
    });
    await request(app.getHttpServer())
      .post('/auth/clientes/esqueci-senha')
      .send({ email: legado.toLowerCase() })
      .expect(200);
    expect(fakeEmailQueue.tokenPara('RECUPERACAO_SENHA', legado.toLowerCase())).toBeTruthy();
  });
});
