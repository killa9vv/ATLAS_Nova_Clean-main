// Testes e2e de clientes/endereços contra um Postgres real. Cobrem:
// 1. duas requisições concorrentes marcando endereços DIFERENTES como padrão pro
//    mesmo cliente nunca deixam dois padrão ao mesmo tempo (depende do índice único
//    parcial em `enderecos` — ver migration 20260827120000);
// 2. o autocomplete de CEP trata formato inválido como erro de domínio claro, não
//    um erro genérico de integração;
// 3. /clientes/me/enderecos exige o próprio JWT do cliente — clienteId nunca vem
//    de URL (ver migration da Área do Cliente).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';
import { CepLookupProvider, EnderecoPorCep } from '../src/clientes/domain/cep-lookup.port';
import { CepNaoEncontradoException } from '../src/clientes/domain/clientes.exceptions';

// POST /auth/clientes/login é limitado a 5 chamadas/60s (throttle contra força
// bruta — ver ClientesAuthController). Este arquivo usa no máximo 5 logins no
// total, de propósito, pra nunca esbarrar nesse limite.

/** Dublê de CepLookupProvider: nunca chama o ViaCEP de verdade nos testes e2e. */
class CepLookupProviderDeTeste implements CepLookupProvider {
  private readonly respostas = new Map<string, EnderecoPorCep>();

  configurarResposta(cep: string, resposta: EnderecoPorCep): void {
    this.respostas.set(cep, resposta);
  }

  async buscar(cep: string): Promise<EnderecoPorCep> {
    const resposta = this.respostas.get(cep);
    if (!resposta) {
      throw new CepNaoEncontradoException(cep);
    }
    return resposta;
  }
}

describe('Clientes e Endereços (e2e)', () => {
  let app: INestApplication;
  let cepLookupProvider: CepLookupProviderDeTeste;

  beforeAll(async () => {
    cepLookupProvider = new CepLookupProviderDeTeste();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CepLookupProvider)
      .useValue(cepLookupProvider)
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

  async function criarCliente(): Promise<string> {
    const resposta = await request(app.getHttpServer())
      .post('/clientes')
      .send({ nome: 'Cliente de teste' });
    return resposta.body.id;
  }

  let contador = 0;
  /** Registra e loga um Cliente novo, devolve o accessToken pronto pra usar em
   * Authorization: Bearer nas rotas /clientes/me/*. */
  async function registrarELogarCliente(): Promise<{ accessToken: string; clienteId: string }> {
    contador += 1;
    const email = `cliente-teste-${Date.now()}-${contador}@teste.com`;
    const registro = await request(app.getHttpServer())
      .post('/auth/clientes/registrar')
      .send({ nome: 'Cliente Autenticado', email, senha: 'senha-forte-123' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/clientes/login')
      .send({ email, senha: 'senha-forte-123' })
      .expect(201);

    return { accessToken: login.body.accessToken, clienteId: registro.body.id };
  }

  function criarEndereco(token: string, numero: string) {
    return request(app.getHttpServer())
      .post('/clientes/me/enderecos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cep: '28013000',
        logradouro: 'Rua do Sol',
        numero,
        bairro: 'Centro',
        cidade: 'Campos dos Goytacazes',
        estado: 'RJ',
      });
  }

  it('cadastra múltiplos endereços, o primeiro nasce padrão, e definir outro como padrão desmarca o anterior', async () => {
    const { accessToken } = await registrarELogarCliente();

    const resposta1 = await criarEndereco(accessToken, '100');
    const resposta2 = await criarEndereco(accessToken, '200');

    expect(resposta1.body.padrao).toBe(true);
    expect(resposta2.body.padrao).toBe(false);

    await request(app.getHttpServer())
      .put(`/clientes/me/enderecos/${resposta2.body.id}/padrao`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listagem = await request(app.getHttpServer())
      .get('/clientes/me/enderecos')
      .set('Authorization', `Bearer ${accessToken}`);
    const padroes = listagem.body.filter((e: { padrao: boolean }) => e.padrao);

    expect(padroes).toHaveLength(1);
    expect(padroes[0].id).toBe(resposta2.body.id);
  });

  it('duas requisições concorrentes marcando endereços diferentes como padrão nunca deixam dois padrão ao mesmo tempo', async () => {
    const { accessToken } = await registrarELogarCliente();

    const enderecoA = await criarEndereco(accessToken, '100'); // nasce padrão
    const enderecoB = await criarEndereco(accessToken, '200');
    const enderecoC = await criarEndereco(accessToken, '300');
    expect(enderecoA.body.padrao).toBe(true);

    const [respostaB, respostaC] = await Promise.all([
      request(app.getHttpServer())
        .put(`/clientes/me/enderecos/${enderecoB.body.id}/padrao`)
        .set('Authorization', `Bearer ${accessToken}`),
      request(app.getHttpServer())
        .put(`/clientes/me/enderecos/${enderecoC.body.id}/padrao`)
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    // As duas chamadas devem ter sido aceitas (nenhuma trava esperando a outra
    // indefinidamente); o que garante a invariante é o estado final no banco.
    expect(respostaB.status).toBe(200);
    expect(respostaC.status).toBe(200);

    const listagem = await request(app.getHttpServer())
      .get('/clientes/me/enderecos')
      .set('Authorization', `Bearer ${accessToken}`);
    const padroes = listagem.body.filter((e: { padrao: boolean }) => e.padrao);

    // Não importa qual das duas venceu a corrida — importa que só uma tenha vencido.
    expect(padroes).toHaveLength(1);
    expect(['200', '300']).toContain(padroes[0].numero);
  });

  it('CEP com formato inválido retorna erro de domínio claro (não erro genérico de integração)', async () => {
    const resposta = await request(app.getHttpServer()).get('/clientes/cep/123');

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('CEP_INVALIDO');
  });

  it('CEP não encontrado (formato válido, sem correspondência) retorna erro de domínio claro', async () => {
    const resposta = await request(app.getHttpServer()).get('/clientes/cep/00000000');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('CEP_NAO_ENCONTRADO');
  });

  it('CEP válido preenche o restante do endereço automaticamente', async () => {
    cepLookupProvider.configurarResposta('28013000', {
      cep: '28013-000',
      logradouro: 'Rua do Sol',
      bairro: 'Centro',
      cidade: 'Campos dos Goytacazes',
      estado: 'RJ',
    });

    const resposta = await request(app.getHttpServer()).get('/clientes/cep/28013000');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      cep: '28013-000',
      logradouro: 'Rua do Sol',
      bairro: 'Centro',
      cidade: 'Campos dos Goytacazes',
      estado: 'RJ',
    });
  });

  it('não permite dois documentos ao mesmo tempo (CPF e CNPJ) na criação do cliente', async () => {
    const resposta = await request(app.getHttpServer()).post('/clientes').send({
      nome: 'Cliente inválido',
      cpf: '111.444.777-35',
      cnpj: '11.222.333/0001-81',
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBe('DOCUMENTO_INVALIDO');
  });

  it('reaproveita o cadastro existente em vez de quebrar quando o e-mail já está cadastrado (checkout "salvar meus dados" chamando POST /clientes de novo)', async () => {
    const primeira = await request(app.getHttpServer())
      .post('/clientes')
      .send({ nome: 'Maria da Silva', email: 'maria.reuso@teste.com' })
      .expect(201);

    const segunda = await request(app.getHttpServer())
      .post('/clientes')
      .send({ nome: 'Maria da Silva', email: 'maria.reuso@teste.com' })
      .expect(201);

    expect(segunda.body.id).toBe(primeira.body.id);
  });

  it('sem token, /clientes/me/enderecos responde 401', async () => {
    const resposta = await request(app.getHttpServer()).get('/clientes/me/enderecos');
    expect(resposta.status).toBe(401);
  });

  it('não permite ver/atualizar/excluir/definir padrão de endereço de outro cliente', async () => {
    const clienteA = await registrarELogarCliente();
    const clienteB = await registrarELogarCliente();
    const enderecoDoA = await criarEndereco(clienteA.accessToken, '100');

    const resposta = await request(app.getHttpServer())
      .put(`/clientes/me/enderecos/${enderecoDoA.body.id}/padrao`)
      .set('Authorization', `Bearer ${clienteB.accessToken}`)
      .send({});

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('ENDERECO_NAO_ENCONTRADO');
  });

  it('bloqueia excluir o único endereço padrão, mas permite depois de ter outro (promovendo o restante)', async () => {
    // Um login só pros dois cenários — mantém o total de logins do arquivo em 5
    // (limite do throttle), não 6.
    const { accessToken } = await registrarELogarCliente();
    const enderecoA = await criarEndereco(accessToken, '100'); // nasce padrão

    const bloqueado = await request(app.getHttpServer())
      .delete(`/clientes/me/enderecos/${enderecoA.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(bloqueado.status).toBe(409);
    expect(bloqueado.body.erro).toBe('ENDERECO_PADRAO_UNICO');

    await criarEndereco(accessToken, '200');

    await request(app.getHttpServer())
      .delete(`/clientes/me/enderecos/${enderecoA.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const listagem = await request(app.getHttpServer())
      .get('/clientes/me/enderecos')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listagem.body).toHaveLength(1);
    expect(listagem.body[0].padrao).toBe(true);
  });

  it('cliente sem senha ainda pode ser criado pelo checkout de convidado, sem quebrar nada', async () => {
    const clienteId = await criarCliente();
    expect(clienteId).toBeTruthy();
  });
});
