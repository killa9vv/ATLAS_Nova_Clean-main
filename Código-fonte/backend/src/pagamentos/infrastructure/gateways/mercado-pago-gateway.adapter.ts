import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'crypto';
import {
  CriarPagamentoCartaoInput,
  CriarPagamentoPixInput,
  PaymentGateway,
  ResultadoPagamentoGateway,
} from '../../domain/payment-gateway.port';
import {
  CredenciaisInvalidasGatewayException,
  GatewayIndisponivelException,
  PagamentoRecusadoException,
} from '../../domain/pagamentos.exceptions';
import { mapearStatusMercadoPago } from './mercado-pago-status.mapper';

const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';

interface RespostaPagamentoMercadoPago {
  id: number | string;
  status: string;
  status_detail?: string;
  transaction_amount: number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
}

/**
 * Implementação concreta da porta PaymentGateway para o Mercado Pago.
 * Fala diretamente com a API REST de Payments (v1) via axios — nenhum tipo
 * ou detalhe deste adapter vaza para o domínio/aplicação.
 */
@Injectable()
export class MercadoPagoGatewayAdapter extends PaymentGateway {
  private readonly http: AxiosInstance;
  private readonly notificationUrl?: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    this.notificationUrl =
      this.configService.get<string>('MERCADOPAGO_NOTIFICATION_URL') || undefined;
    this.http = axios.create({
      baseURL: MERCADO_PAGO_API_URL,
      timeout: 10_000,
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  }

  async criarPagamentoPix(input: CriarPagamentoPixInput): Promise<ResultadoPagamentoGateway> {
    const resposta = await this.executarChamada(() =>
      this.http.post<RespostaPagamentoMercadoPago>(
        '/v1/payments',
        {
          transaction_amount: input.valor,
          description: input.descricao,
          payment_method_id: 'pix',
          external_reference: input.referenciaExterna,
          notification_url: this.notificationUrl,
          payer: this.montarPayer(input.pagador),
        },
        { headers: this.headerIdempotencia() },
      ),
    );
    return this.paraResultado(resposta.data);
  }

  async criarPagamentoCartao(input: CriarPagamentoCartaoInput): Promise<ResultadoPagamentoGateway> {
    const resposta = await this.executarChamada(() =>
      this.http.post<RespostaPagamentoMercadoPago>(
        '/v1/payments',
        {
          transaction_amount: input.valor,
          description: input.descricao,
          token: input.tokenCartao,
          installments: input.parcelas,
          payment_method_id: input.metodoPagamentoId,
          external_reference: input.referenciaExterna,
          notification_url: this.notificationUrl,
          payer: this.montarPayer(input.pagador),
        },
        { headers: this.headerIdempotencia() },
      ),
    );
    return this.paraResultado(resposta.data);
  }

  /**
   * A API de Payments do Mercado Pago exige X-Idempotency-Key em toda criação
   * de pagamento (evita cobrança duplicada se a requisição for reenviada).
   * Uma chave nova por chamada é correto aqui pois hoje não há retry automático.
   */
  private headerIdempotencia() {
    return { 'X-Idempotency-Key': randomUUID() };
  }

  async consultarPagamento(gatewayTransactionId: string): Promise<ResultadoPagamentoGateway> {
    const resposta = await this.executarChamada(() =>
      this.http.get<RespostaPagamentoMercadoPago>(`/v1/payments/${gatewayTransactionId}`),
    );
    return this.paraResultado(resposta.data);
  }

  private montarPayer(pagador: CriarPagamentoPixInput['pagador']) {
    return {
      email: pagador.email,
      first_name: pagador.nome,
      identification: pagador.cpf ? { type: 'CPF', number: pagador.cpf } : undefined,
    };
  }

  private async executarChamada<T>(chamada: () => Promise<T>): Promise<T> {
    try {
      return await chamada();
    } catch (erro) {
      throw this.traduzirErro(erro);
    }
  }

  private traduzirErro(erro: unknown): Error {
    if (!axios.isAxiosError(erro)) {
      return new GatewayIndisponivelException(erro instanceof Error ? erro.message : String(erro));
    }

    const status = erro.response?.status;

    // 401 = token ausente/inválido (nosso problema de credenciais).
    // 403 = a própria operação foi recusada por regra de negócio do gateway
    // (ex.: "Payer email forbidden") — não é problema de credencial, então
    // cai no branch de PagamentoRecusadoException abaixo.
    if (status === 401) {
      const detalhe =
        (erro.response?.data as { message?: string } | undefined)?.message ?? erro.message;
      return new CredenciaisInvalidasGatewayException(detalhe);
    }
    if (!erro.response || status === undefined || status >= 500 || erro.code === 'ECONNABORTED') {
      return new GatewayIndisponivelException(erro.message);
    }

    const mensagem =
      (
        erro.response.data as
          { message?: string; cause?: Array<{ description?: string }> } | undefined
      )?.message ?? erro.message;
    return new PagamentoRecusadoException(mensagem);
  }

  private paraResultado(dados: RespostaPagamentoMercadoPago): ResultadoPagamentoGateway {
    return {
      gatewayTransactionId: String(dados.id),
      status: mapearStatusMercadoPago(dados.status, dados.status_detail),
      valor: Number(dados.transaction_amount),
      qrCode: dados.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: dados.point_of_interaction?.transaction_data?.qr_code_base64,
      payloadBruto: dados,
    };
  }
}
