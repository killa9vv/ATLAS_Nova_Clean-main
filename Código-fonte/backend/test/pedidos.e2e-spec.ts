// Teste e2e do fluxo de criação de pedido contra um Postgres real. A criação do
// pedido NÃO reserva estoque — só valida disponibilidade em leitura (via
// MontarCarrinhoUseCase, fail-fast pra UX). O decremento de verdade, e a garantia de
// exclusão mútua entre pedidos concorrentes pelo último item, acontecem na confirmação
// do pagamento — ver a suíte de concorrência em test/pagamentos-webhook.e2e-spec.ts e a
// decisão documentada no README raiz.
//
// Sem MELHOR_ENVIO_TOKEN configurado nesta suíte, ShippingQuoteProviderComFallback cai
// direto pra tabela regional (TabelaRegionalShippingQuoteProvider) — determinística por
// prefixo de CEP, não depende de rede. Os produtos de teste têm dados físicos reais
// (pesoKg etc.) só pra exercitar esse caminho no MelhorEnvioShippingQuoteProvider; a
// tabela regional ignora esses dados (só olha o CEP).
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';

describe('Pedidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let produtoTipoId: string;
  let marcaId: string;
  let tokenAdmin: string;

  const enderecoValido = {
    cep: '28013-000',
    logradouro: 'Rua do Sol',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Campos dos Goytacazes',
    estado: 'RJ',
  };

  const contatoValido = {
    nome: 'Maria da Silva',
    email: 'maria@example.com',
    telefone: '(22) 99999-8888',
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Replica o bootstrap real de src/main.ts, pra exercitar o mesmo comportamento
    // de validação/erro que roda em produção.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);
    const jwtService = moduleRef.get(JwtService);
    tokenAdmin = jwtService.sign({ sub: randomUUID(), email: 'admin@teste.com', papel: 'ADMIN' });

    // Produto agora exige categoria/marca/tipo — cria essa base uma única vez
    // e reutiliza em todo o arquivo, já que os testes só se importam com estoque.
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

  function criarProdutoComEstoque(estoque: number) {
    return prisma.produto.create({
      data: {
        id: randomUUID(),
        nome: `Produto de teste ${randomUUID()}`,
        slug: `produto-teste-${randomUUID()}`,
        pack: 'unidade',
        preco: 10,
        estoque,
        produtoTipoId,
        marcaId,
        pesoKg: 1,
        alturaCm: 10,
        larguraCm: 10,
        comprimentoCm: 10,
      },
    });
  }

  it('cria o pedido sem reservar estoque (o decremento só acontece na confirmação do pagamento)', async () => {
    const produto = await criarProdutoComEstoque(5);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 2 }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
      })
      .expect(201);

    expect(resposta.body.itens).toHaveLength(1);
    expect(resposta.body.total).toBe(20);
    expect(resposta.body.contato).toMatchObject(contatoValido);

    const produtoInalterado = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    expect(produtoInalterado.estoque).toBe(5);
  });

  it('rejeita o pedido quando a quantidade excede o estoque disponível no momento da leitura (409)', async () => {
    const produto = await criarProdutoComEstoque(1);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 5 }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
      })
      .expect(409);

    expect(resposta.body.erro).toBe('ESTOQUE_INSUFICIENTE');

    const produtoInalterado = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    expect(produtoInalterado.estoque).toBe(1);
  });

  it('rejeita corpo inválido com 400 (pedido sem nenhum item)', async () => {
    await request(app.getHttpServer())
      .post('/pedidos')
      .send({ itens: [], tipoEntrega: 'RETIRADA', contato: contatoValido })
      .expect(400);
  });

  it('rejeita corpo inválido com 400 (sem tipoEntrega)', async () => {
    const produto = await criarProdutoComEstoque(5);

    await request(app.getHttpServer())
      .post('/pedidos')
      .send({ itens: [{ produtoId: produto.id, quantidade: 1 }], contato: contatoValido })
      .expect(400);
  });

  it('rejeita corpo inválido com 400 (sem contato)', async () => {
    const produto = await criarProdutoComEstoque(5);

    await request(app.getHttpServer())
      .post('/pedidos')
      .send({ itens: [{ produtoId: produto.id, quantidade: 1 }], tipoEntrega: 'RETIRADA' })
      .expect(400);
  });

  it('registra o pedido em AGUARDANDO_CONTATO quando o canal é whatsapp', async () => {
    const produto = await criarProdutoComEstoque(5);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
        canal: 'whatsapp',
      })
      .expect(201);

    expect(resposta.body.status).toBe('AGUARDANDO_CONTATO');
  });

  it('sem canal informado, o pedido usa o default (CRIADO) — mesmo comportamento de antes', async () => {
    const produto = await criarProdutoComEstoque(5);

    const resposta = await request(app.getHttpServer())
      .post('/pedidos')
      .send({
        itens: [{ produtoId: produto.id, quantidade: 1 }],
        tipoEntrega: 'RETIRADA',
        contato: contatoValido,
      })
      .expect(201);

    expect(resposta.body.status).toBe('CRIADO');
  });

  it('dois pedidos concorrentes pelo último item podem ser criados ao mesmo tempo — nada é reservado na criação', async () => {
    const produto = await criarProdutoComEstoque(1);

    const [respostaA, respostaB] = await Promise.all([
      request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        }),
      request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        }),
    ]);

    expect([respostaA.status, respostaB.status]).toEqual([201, 201]);

    // Estoque não muda: a exclusão mútua de verdade só é aplicada quando um dos dois
    // pagamentos for confirmado (ver test/pagamentos-webhook.e2e-spec.ts).
    const produtoFinal = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    expect(produtoFinal.estoque).toBe(1);
  });

  describe('tipo de entrega', () => {
    it('RETIRADA: não cobra frete e não grava endereço, mesmo se um for enviado', async () => {
      const produto = await criarProdutoComEstoque(5);

      const resposta = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          endereco: enderecoValido,
          contato: contatoValido,
        })
        .expect(201);

      expect(resposta.body.tipoEntrega).toBe('RETIRADA');
      expect(resposta.body.valorFrete).toBe(0);
      expect(resposta.body.total).toBe(10);
      expect(resposta.body.itens[0].freteRateado).toBe(0);
      expect(resposta.body.endereco).toBeUndefined();
    });

    it('ENTREGA sem endereço é rejeitado com 400', async () => {
      const produto = await criarProdutoComEstoque(5);

      await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'ENTREGA',
          contato: contatoValido,
        })
        .expect(400);
    });

    it('ENTREGA com endereço válido cobra frete (tabela regional, sem Melhor Envio configurado), soma ao total e rateia entre os itens', async () => {
      const produto = await criarProdutoComEstoque(5);

      const resposta = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'ENTREGA',
          endereco: enderecoValido,
          contato: contatoValido,
        })
        .expect(201);

      expect(resposta.body.tipoEntrega).toBe('ENTREGA');
      // CEP 28013-000 cai na faixa local da tabela regional (ver
      // tabela-regional.adapter.ts) — valor 12, sem MELHOR_ENVIO_TOKEN configurado
      // nesta suíte de testes.
      expect(resposta.body.valorFrete).toBe(12);
      expect(resposta.body.total).toBe(22);
      expect(resposta.body.endereco).toMatchObject(enderecoValido);
      // Item único: 100% do frete rateado pra ele.
      expect(resposta.body.itens[0].freteRateado).toBe(12);

      const pedidoPersistido = await prisma.pedido.findUniqueOrThrow({
        where: { id: resposta.body.id },
        include: { itens: true },
      });
      expect(Number(pedidoPersistido.valorFrete)).toBe(12);
      expect(Number(pedidoPersistido.itens[0].freteRateado)).toBe(12);
    });
  });

  describe('identificação do comprador', () => {
    it('vincula o pedido a um cliente cadastrado quando clienteId é informado', async () => {
      const produto = await criarProdutoComEstoque(5);
      const cliente = await prisma.cliente.create({
        data: { nome: 'Cliente de teste', email: `cliente-${randomUUID()}@teste.com` },
      });

      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
          clienteId: cliente.id,
        })
        .expect(201);

      const resposta = await request(app.getHttpServer())
        .get(`/pedidos/${criacao.body.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(resposta.body.clienteId).toBe(cliente.id);
    });

    it('rejeita clienteId de um cliente inexistente (404)', async () => {
      const produto = await criarProdutoComEstoque(5);

      const resposta = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
          clienteId: randomUUID(),
        })
        .expect(404);

      expect(resposta.body.erro).toBe('CLIENTE_NAO_ENCONTRADO');
    });

    it('GET /pedidos/:id/status (público) nunca expõe contato nem clienteId', async () => {
      const produto = await criarProdutoComEstoque(5);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        });

      const resposta = await request(app.getHttpServer())
        .get(`/pedidos/${criacao.body.id}/status`)
        .expect(200);

      expect(resposta.body.contato).toBeUndefined();
      expect(resposta.body.clienteId).toBeUndefined();
    });
  });

  describe('GET /pedidos (admin)', () => {
    it('rejeita sem token (401)', async () => {
      await request(app.getHttpServer()).get('/pedidos').expect(401);
    });

    it('lista os pedidos existentes, mais recentes primeiro, pra quem tem token de admin', async () => {
      const produto = await criarProdutoComEstoque(5);

      await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        })
        .expect(201);

      const resposta = await request(app.getHttpServer())
        .get('/pedidos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(Array.isArray(resposta.body)).toBe(true);
      expect(resposta.body.length).toBeGreaterThan(0);

      const datas = resposta.body.map((p: { createdAt: string }) =>
        new Date(p.createdAt).getTime(),
      );
      const datasOrdenadas = [...datas].sort((a, b) => b - a);
      expect(datas).toEqual(datasOrdenadas);
    });
  });

  describe('PATCH /pedidos/:id/status (admin)', () => {
    it('rejeita sem token (401)', async () => {
      const produto = await criarProdutoComEstoque(5);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        });

      await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/status`)
        .send({ status: 'CANCELADO' })
        .expect(401);
    });

    it('cancela um pedido AGUARDANDO_CONTATO sem mexer no estoque', async () => {
      const produto = await criarProdutoComEstoque(5);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
          canal: 'whatsapp',
        });
      expect(criacao.body.status).toBe('AGUARDANDO_CONTATO');

      const resposta = await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'CANCELADO' })
        .expect(200);

      expect(resposta.body.status).toBe('CANCELADO');
      const produtoInalterado = await prisma.produto.findUniqueOrThrow({
        where: { id: produto.id },
      });
      expect(produtoInalterado.estoque).toBe(5);
    });

    it('confirma manualmente um pedido de WhatsApp como PAGO e decrementa o estoque', async () => {
      const produto = await criarProdutoComEstoque(3);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 2 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
          canal: 'whatsapp',
        });

      const resposta = await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'PAGO' })
        .expect(200);

      expect(resposta.body.status).toBe('PAGO');
      const produtoAtualizado = await prisma.produto.findUniqueOrThrow({
        where: { id: produto.id },
      });
      expect(produtoAtualizado.estoque).toBe(1);
    });

    it('rejeita marcar um pedido CRIADO como PAGO na mão (409) — só via pagamento online', async () => {
      const produto = await criarProdutoComEstoque(5);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        });
      expect(criacao.body.status).toBe('CRIADO');

      const resposta = await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'PAGO' })
        .expect(409);

      expect(resposta.body.erro).toBe('PEDIDO_EM_STATUS_INVALIDO');
    });

    it('estorna um pedido PAGO e devolve o estoque', async () => {
      const produto = await criarProdutoComEstoque(3);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 2 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
          canal: 'whatsapp',
        });
      await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'PAGO' })
        .expect(200);

      const resposta = await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/status`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ status: 'ESTORNADO' })
        .expect(200);

      expect(resposta.body.status).toBe('ESTORNADO');
      const produtoDevolvido = await prisma.produto.findUniqueOrThrow({
        where: { id: produto.id },
      });
      expect(produtoDevolvido.estoque).toBe(3);
    });
  });

  describe('PATCH /pedidos/:id/rastreio (admin)', () => {
    it('rejeita sem token (401)', async () => {
      const produto = await criarProdutoComEstoque(5);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        });

      await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/rastreio`)
        .send({ codigoRastreio: 'BR123' })
        .expect(401);
    });

    it('grava e depois limpa o código de rastreio', async () => {
      const produto = await criarProdutoComEstoque(5);
      const criacao = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          itens: [{ produtoId: produto.id, quantidade: 1 }],
          tipoEntrega: 'RETIRADA',
          contato: contatoValido,
        });

      const comRastreio = await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/rastreio`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ codigoRastreio: 'BR123456789BR' })
        .expect(200);
      expect(comRastreio.body.codigoRastreio).toBe('BR123456789BR');

      const semRastreio = await request(app.getHttpServer())
        .patch(`/pedidos/${criacao.body.id}/rastreio`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({})
        .expect(200);
      expect(semRastreio.body.codigoRastreio).toBeUndefined();
    });
  });
});
