import { MetodoPagamento } from '../../domain/metodo-pagamento.enum';
import { DadosPagador } from '../../domain/payment-gateway.port';

export interface CriarPagamentoInput {
  pedidoId: string;
  metodo: MetodoPagamento;
  pagador: DadosPagador;
  /** Obrigatório quando metodo = CARTAO_CREDITO. */
  tokenCartao?: string;
  parcelas?: number;
  metodoPagamentoId?: string;
}

export interface CriarPagamentoOutput {
  pagamentoId: string;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;
}
