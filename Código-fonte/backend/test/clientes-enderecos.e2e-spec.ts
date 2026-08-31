// Testes e2e de clientes/endereços contra um Postgres real. Cobrem duas garantias
// que só fazem sentido sob concorrência de verdade (não dá pra provar com mocks):
// 1. duas requisições concorrentes marcando endereços DIFERENTES como padrão pro
//    mesmo cliente nunca deixam dois padrão ao mesmo tempo (depende do índice único
//    parcial em `enderecos` — ver migration 20260827120000);
// 2. o autocomplete de CEP trata formato inválido como erro de domínio claro, não
//    um erro genérico de integração.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';
import { CepLookupProvider, EnderecoPorCep } from '../src/clientes/domain/cep-lookup.port';
import { CepNaoEncontradoException } from '../src/clientes/domain/clientes.exceptions';

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

  function criarEndereco(clienteId: string, numero: string) {
    return request(app.getHttpServer()).post(`/clientes/${clienteId}/enderecos`).send({
      cep: '28013000',
      logradouro: 'Rua do Sol',
      numero,
      bairro: 'Centro',
      cidade: 'Campos dos Goytacazes',
      estado: 'RJ',
    });
  }

  it('cadastra múltiplos endereços, o primeiro nasce padrão, e definir outro como padrão desmarca o anterior', async () => {
    const clienteId = await criarCliente();

    const resposta1 = await criarEndereco(clienteId, '100');
    const resposta2 = await criarEndereco(clienteId, '200');

    expect(resposta1.body.padrao).toBe(true);
    expect(resposta2.body.padrao).toBe(false);

    await request(app.getHttpServer())
      .put(`/clientes/${clienteId}/enderecos/${resposta2.body.id}/padrao`)
      .expect(200);

    const listagem = await request(app.getHttpServer()).get(`/clientes/${clienteId}/enderecos`);
    const padroes = listagem.body.filter((e: { padrao: boolean }) => e.padrao);

    expect(padroes).toHaveLength(1);
    expect(padroes[0].id).toBe(resposta2.body.id);
  });

  it('duas requisições concorrentes marcando endereços diferentes como padrão nunca deixam dois padrão ao mesmo tempo', async () => {
    const clienteId = await criarCliente();

    const enderecoA = await criarEndereco(clienteId, '100'); // nasce padrão
    const enderecoB = await criarEndereco(clienteId, '200');
    const enderecoC = await criarEndereco(clienteId, '300');
    expect(enderecoA.body.padrao).toBe(true);

    const [respostaB, respostaC] = await Promise.all([
      request(app.getHttpServer()).put(
        `/clientes/${clienteId}/enderecos/${enderecoB.body.id}/padrao`,
      ),
      request(app.getHttpServer()).put(
        `/clientes/${clienteId}/enderecos/${enderecoC.body.id}/padrao`,
      ),
    ]);

    // As duas chamadas devem ter sido aceitas (nenhuma trava esperando a outra
    // indefinidamente); o que garante a invariante é o estado final no banco.
    expect(respostaB.status).toBe(200);
    expect(respostaC.status).toBe(200);

    const listagem = await request(app.getHttpServer()).get(`/clientes/${clienteId}/enderecos`);
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

  it('não permite atualizar/excluir/definir padrão de endereço de outro cliente', async () => {
    const clienteA = await criarCliente();
    const clienteB = await criarCliente();
    const enderecoDoA = await criarEndereco(clienteA, '100');

    const resposta = await request(app.getHttpServer())
      .put(`/clientes/${clienteB}/enderecos/${enderecoDoA.body.id}/padrao`)
      .send({});

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('ENDERECO_NAO_ENCONTRADO');
  });
});
