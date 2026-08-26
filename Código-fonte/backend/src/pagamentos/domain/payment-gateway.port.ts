import { StatusPagamento } from './status-pagamento.enum';

export interface DadosPagador {
  email: string;
  nome?: string;
  cpf?: string;
}

export interface CriarPagamentoPixInput {
  /** Nosso identificador (id do pagamento local) — enviado ao gateway como referência externa. */
  referenciaExterna: string;
  valor: number;
  descricao: string;
  pagador: DadosPagador;
}

export interface CriarPagamentoCartaoInput {
  referenciaExterna: string;
  valor: number;
  descricao: string;
  /** Token gerado no frontend pelo SDK do gateway — nunca trafega número de cartão pelo nosso backend. */
  tokenCartao: string;
  parcelas: number;
  metodoPagamentoId: string;
  pagador: DadosPagador;
}

export interface ResultadoPagamentoGateway {
  gatewayTransactionId: string;
  status: StatusPagamento;
  valor: number;
  /** Presentes apenas para Pix. */
  qrCode?: string;
  qrCodeBase64?: string;
  /** Resposta crua do gateway, guardada para auditoria/debug — nunca inspecionada pelo domínio. */
  payloadBruto: unknown;
}

/**
 * Porta de saída para qualquer gateway de pagamento. O domínio e a aplicação
 * dependem apenas desta interface; o SDK/HTTP do gateway concreto (Mercado
 * Pago, Stripe, etc.) fica isolado na camada de infraestrutura.
 */
export abstract class PaymentGateway {
  abstract criarPagamentoPix(input: CriarPagamentoPixInput): Promise<ResultadoPagamentoGateway>;
  abstract criarPagamentoCartao(
    input: CriarPagamentoCartaoInput,
  ): Promise<ResultadoPagamentoGateway>;
  abstract consultarPagamento(gatewayTransactionId: string): Promise<ResultadoPagamentoGateway>;
}
