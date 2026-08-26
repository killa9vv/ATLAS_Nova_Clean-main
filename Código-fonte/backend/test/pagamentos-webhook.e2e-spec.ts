// Testes e2e do webhook contra um Postgres real. Cobrem duas garantias que só fazem
// sentido sob concorrência de verdade (não dá pra provar com mocks):
// 1. duas notificações concorrentes pra MESMA transação não aplicam a devolução de
//    estoque em duplicidade (depende do UPDATE condicional de
//    PrismaPagamentoRepository.atualizarStatus);
// 2. duas confirmações de pagamento concorrentes de DUAS transações diferentes,
//    disputando o último item em estoque, não vendem as duas — só uma consegue
//    decrementar (depende do UPDATE condicional de
//    PrismaProdutoRepository.decrementarEstoque). É o mesmo teste que existia em
//    pedidos.e2e-spec.ts antes do estoque passar a ser reservado na confirmação do
//    pagamento em vez do checkout.
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { randomUUID } from 'crypto';
import {
  StatusPedido as StatusPedidoPrisma,
  StatusPagamento as StatusPagamentoPrisma,
  MetodoPagamento as MetodoPagamentoPrisma,
} from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { DomainExceptionFilter } from '../src/shared/exceptions/domain-exception.filter';
import {
  PaymentGateway,
  ResultadoPagamentoGateway,
} from '../src/pagamentos/domain/payment-gateway.port';
import { StatusPagamento } from '../src/pagamentos/domain/status-pagamento.enum';

/** Dublê de gateway: nunca fala com o Mercado Pago de verdade, devolve o que o teste configurar por transação. */
class GatewayDeTeste implements PaymentGateway {
  private readonly respostas = new Map<string, ResultadoPagamentoGateway>();

  configurarResposta(resposta: ResultadoPagamentoGateway): void {
    this.respostas.set(resposta.gatewayTransactionId, resposta);
  }

  async criarPagamentoPix(): Promise<ResultadoPagamentoGateway> {
    throw new Error('não usado neste teste');
  }

  async criarPagamentoCartao(): Promise<ResultadoPagamentoGateway> {
    throw new Error('não usado neste teste');
  }

  async consultarPagamento(gatewayTransactionId: string): Promise<ResultadoPagamentoGateway> {
    const resposta = this.respostas.get(gatewayTransactionId);
    if (!resposta) {
      throw new Error(`resposta não configurada pelo teste para ${gatewayTransactionId}`);
    }
    return resposta;
  }
}

describe('Pagamentos - webhook (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let gateway: GatewayDeTeste;
  let produtoTipoId: string;
  let marcaId: string;
  const segredoWebhookOriginal = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  beforeAll(async () => {
    // Sem segredo configurado, o controller só avisa e aceita (fora de produção) —
    // evita que este teste dependa de gerar uma assinatura HMAC válida.
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;

    gateway = new GatewayDeTeste();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PaymentGateway)
      .useValue(gateway)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);

    const categoria = await prisma.categoria.create({
      data: { slug: `categoria-webhook-${randomUUID()}`, nome: 'Categoria de teste (webhook)' },
    });
    const marca = await prisma.marca.create({
      data: { nome: `Marca de teste (webhook) ${randomUUID()}` },
    });
    const produtoTipo = await prisma.produtoTipo.create({
      data: { categoriaId: categoria.id, nome: `Tipo de teste (webhook) ${randomUUID()}` },
    });
    produtoTipoId = produtoTipo.id;
    marcaId = marca.id;
  });

  afterAll(async () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = segredoWebhookOriginal;
    await app.close();
  });

  function criarProdutoComEstoque(estoque: number) {
    return prisma.produto.create({
      data: {
        id: randomUUID(),
        nome: `Produto de teste (webhook) ${randomUUID()}`,
        slug: `produto-webhook-${randomUUID()}`,
        pack: 'unidade',
        preco: 10,
        estoque,
        produtoTipoId,
        marcaId,
      },
    });
  }

  it('não devolve o estoque em duplicidade quando o estorno chega em duas notificações concorrentes', async () => {
    // Estoque começa em 3 — já reflete a baixa de 2 unidades feita na confirmação do pedido pago.
    const produto = await criarProdutoComEstoque(3);

    const pedido = await prisma.pedido.create({
      data: {
        status: StatusPedidoPrisma.PAGO,
        total: 20,
        itens: {
          create: [{ produtoId: produto.id, nome: produto.nome, quantidade: 2, precoUnitario: 10 }],
        },
      },
    });

    const gatewayTransactionId = `mp-estorno-${randomUUID()}`;
    await prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        metodo: MetodoPagamentoPrisma.PIX,
        status: StatusPagamentoPrisma.APROVADO,
        valor: 20,
        gatewayTransactionId,
      },
    });

    gateway.configurarResposta({
      gatewayTransactionId,
      status: StatusPagamento.ESTORNADO,
      valor: 20,
      payloadBruto: { status: 'refunded' },
    });

    const corpoWebhook = { type: 'payment', data: { id: gatewayTransactionId } };

    const [respostaA, respostaB] = await Promise.all([
      request(app.getHttpServer()).post('/pagamentos/webhook').send(corpoWebhook),
      request(app.getHttpServer()).post('/pagamentos/webhook').send(corpoWebhook),
    ]);

    expect(respostaA.status).toBe(200);
    expect(respostaB.status).toBe(200);

    const produtoFinal = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    // 3 (estoque atual) + 2 (devolvidos pelo estorno) = 5. Se a corrida não estivesse
    // fechada, as duas notificações devolveriam 2 cada uma, e o resultado seria 7.
    expect(produtoFinal.estoque).toBe(5);

    const pedidoFinal = await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } });
    expect(pedidoFinal.status).toBe(StatusPedidoPrisma.ESTORNADO);

    const pagamentoFinal = await prisma.pagamento.findUniqueOrThrow({
      where: { gatewayTransactionId },
    });
    expect(pagamentoFinal.status).toBe(StatusPagamentoPrisma.ESTORNADO);
  });

  it('duas confirmações de pagamento concorrentes pelo último item: só uma decrementa o estoque e vira PAGO', async () => {
    const produto = await criarProdutoComEstoque(1);

    const criarPedidoAguardandoPagamento = () =>
      prisma.pedido.create({
        data: {
          status: StatusPedidoPrisma.AGUARDANDO_PAGAMENTO,
          total: 10,
          itens: {
            create: [
              { produtoId: produto.id, nome: produto.nome, quantidade: 1, precoUnitario: 10 },
            ],
          },
        },
      });

    const [pedidoA, pedidoB] = await Promise.all([
      criarPedidoAguardandoPagamento(),
      criarPedidoAguardandoPagamento(),
    ]);

    const txA = `mp-confirma-a-${randomUUID()}`;
    const txB = `mp-confirma-b-${randomUUID()}`;

    await Promise.all([
      prisma.pagamento.create({
        data: {
          pedidoId: pedidoA.id,
          metodo: MetodoPagamentoPrisma.PIX,
          status: StatusPagamentoPrisma.PENDENTE,
          valor: 10,
          gatewayTransactionId: txA,
        },
      }),
      prisma.pagamento.create({
        data: {
          pedidoId: pedidoB.id,
          metodo: MetodoPagamentoPrisma.PIX,
          status: StatusPagamentoPrisma.PENDENTE,
          valor: 10,
          gatewayTransactionId: txB,
        },
      }),
    ]);

    gateway.configurarResposta({
      gatewayTransactionId: txA,
      status: StatusPagamento.APROVADO,
      valor: 10,
      payloadBruto: {},
    });
    gateway.configurarResposta({
      gatewayTransactionId: txB,
      status: StatusPagamento.APROVADO,
      valor: 10,
      payloadBruto: {},
    });

    const [respostaA, respostaB] = await Promise.all([
      request(app.getHttpServer())
        .post('/pagamentos/webhook')
        .send({ type: 'payment', data: { id: txA } }),
      request(app.getHttpServer())
        .post('/pagamentos/webhook')
        .send({ type: 'payment', data: { id: txB } }),
    ]);

    // O endpoint sempre responde 200 pro Mercado Pago (mesmo quando o pedido não pôde
    // ser confirmado por falta de estoque) — não é um erro de entrega da notificação,
    // é uma anomalia de negócio que fica registrada em log pra reconciliação manual.
    expect(respostaA.status).toBe(200);
    expect(respostaB.status).toBe(200);

    const [pedidoAFinal, pedidoBFinal] = await Promise.all([
      prisma.pedido.findUniqueOrThrow({ where: { id: pedidoA.id } }),
      prisma.pedido.findUniqueOrThrow({ where: { id: pedidoB.id } }),
    ]);
    const statusFinais = [pedidoAFinal.status, pedidoBFinal.status].sort();

    // Exatamente um dos dois vira PAGO; o outro fica pra trás (não regride pra
    // CANCELADO sozinho — fica como está, aguardando reconciliação manual/estorno).
    expect(statusFinais).toEqual(
      [StatusPedidoPrisma.AGUARDANDO_PAGAMENTO, StatusPedidoPrisma.PAGO].sort(),
    );

    const produtoFinal = await prisma.produto.findUniqueOrThrow({ where: { id: produto.id } });
    expect(produtoFinal.estoque).toBe(0);
  });

  it('rejeita webhook de transação de pagamento desconhecida com 404', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/pagamentos/webhook')
      .send({ type: 'payment', data: { id: `mp-inexistente-${randomUUID()}` } });

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('PAGAMENTO_NAO_ENCONTRADO');
  });

  it('ignora notificações que não são de pagamento (ex: type diferente de "payment")', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/pagamentos/webhook')
      .send({ type: 'subscription_preapproval', data: { id: 'irrelevante' } });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ recebido: true });
  });
});
