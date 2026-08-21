import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MercadoPagoGatewayAdapter } from './mercado-pago-gateway.adapter';
import {
  CredenciaisInvalidasGatewayException,
  GatewayIndisponivelException,
  PagamentoRecusadoException,
} from '../../domain/pagamentos.exceptions';
import { StatusPagamento } from '../../domain/status-pagamento.enum';

jest.mock('axios');

const axiosMock = axios as jest.Mocked<typeof axios>;

describe('MercadoPagoGatewayAdapter', () => {
  let httpMock: { post: jest.Mock; get: jest.Mock; interceptors: any };
  let adapter: MercadoPagoGatewayAdapter;

  beforeEach(() => {
    httpMock = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    };
    axiosMock.create.mockReturnValue(httpMock as any);
    axiosMock.isAxiosError.mockImplementation((erro: any) => Boolean(erro?.isAxiosError));

    const configService = { get: jest.fn().mockReturnValue('token-de-teste') } as unknown as ConfigService;
    adapter = new MercadoPagoGatewayAdapter(configService);
  });

  afterEach(() => jest.resetAllMocks());

  it('cria pagamento Pix e mapeia o resultado do gateway, incluindo QR code', async () => {
    httpMock.post.mockResolvedValue({
      data: {
        id: 123456789,
        status: 'pending',
        transaction_amount: 55.5,
        point_of_interaction: {
          transaction_data: { qr_code: '000201...', qr_code_base64: 'aGVsbG8=' },
        },
      },
    });

    const resultado = await adapter.criarPagamentoPix({
      referenciaExterna: 'pedido-1',
      valor: 55.5,
      descricao: 'Pedido 1 - Atlas Nova Clean',
      pagador: { email: 'cliente@example.com' },
    });

    expect(httpMock.post).toHaveBeenCalledWith(
      '/v1/payments',
      expect.objectContaining({ payment_method_id: 'pix', external_reference: 'pedido-1' }),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Idempotency-Key': expect.any(String) }) }),
    );
    expect(resultado.gatewayTransactionId).toBe('123456789');
    expect(resultado.status).toBe(StatusPagamento.PENDENTE);
    expect(resultado.qrCode).toBe('000201...');
    expect(resultado.qrCodeBase64).toBe('aGVsbG8=');
  });

  it('mapeia pagamento de cartão recusado pela operadora para status RECUSADO sem lançar exceção de infra', async () => {
    httpMock.post.mockResolvedValue({
      data: { id: 42, status: 'rejected', status_detail: 'cc_rejected_insufficient_amount', transaction_amount: 100 },
    });

    const resultado = await adapter.criarPagamentoCartao({
      referenciaExterna: 'pedido-2',
      valor: 100,
      descricao: 'Pedido 2',
      tokenCartao: 'tok_abc',
      parcelas: 1,
      metodoPagamentoId: 'visa',
      pagador: { email: 'cliente@example.com' },
    });

    expect(resultado.status).toBe(StatusPagamento.RECUSADO);
  });

  it('consulta pagamento existente e mapeia status aprovado', async () => {
    httpMock.get.mockResolvedValue({ data: { id: 999, status: 'approved', transaction_amount: 10 } });

    const resultado = await adapter.consultarPagamento('999');

    expect(httpMock.get).toHaveBeenCalledWith('/v1/payments/999');
    expect(resultado.status).toBe(StatusPagamento.APROVADO);
  });

  it('traduz erro 401 do gateway em CredenciaisInvalidasGatewayException', async () => {
    httpMock.post.mockRejectedValue({ isAxiosError: true, response: { status: 401 }, message: 'unauthorized' });

    await expect(
      adapter.criarPagamentoPix({
        referenciaExterna: 'pedido-3',
        valor: 10,
        descricao: 'x',
        pagador: { email: 'a@a.com' },
      }),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasGatewayException);
  });

  it('traduz erro 403 de recusa de negócio (ex.: "payer email forbidden") em PagamentoRecusadoException, não credencial', async () => {
    httpMock.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { message: 'Payer email forbidden' } },
      message: 'Request failed with status code 403',
    });

    await expect(
      adapter.criarPagamentoPix({
        referenciaExterna: 'pedido-6',
        valor: 10,
        descricao: 'x',
        pagador: { email: 'a@a.com' },
      }),
    ).rejects.toBeInstanceOf(PagamentoRecusadoException);
  });

  it('traduz timeout/erro de rede em GatewayIndisponivelException', async () => {
    httpMock.post.mockRejectedValue({ isAxiosError: true, code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' });

    await expect(
      adapter.criarPagamentoPix({
        referenciaExterna: 'pedido-4',
        valor: 10,
        descricao: 'x',
        pagador: { email: 'a@a.com' },
      }),
    ).rejects.toBeInstanceOf(GatewayIndisponivelException);
  });

  it('traduz erro 5xx do gateway em GatewayIndisponivelException', async () => {
    httpMock.get.mockRejectedValue({ isAxiosError: true, response: { status: 503 }, message: 'service unavailable' });

    await expect(adapter.consultarPagamento('1')).rejects.toBeInstanceOf(GatewayIndisponivelException);
  });

  it('traduz erro 4xx de validação (token de cartão inválido) em PagamentoRecusadoException', async () => {
    httpMock.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { message: 'invalid token' } },
      message: 'Request failed with status code 400',
    });

    await expect(
      adapter.criarPagamentoCartao({
        referenciaExterna: 'pedido-5',
        valor: 10,
        descricao: 'x',
        tokenCartao: 'tok_invalido',
        parcelas: 1,
        metodoPagamentoId: 'visa',
        pagador: { email: 'a@a.com' },
      }),
    ).rejects.toThrow(PagamentoRecusadoException);
  });
});
