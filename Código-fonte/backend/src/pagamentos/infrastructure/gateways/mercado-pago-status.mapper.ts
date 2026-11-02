import { StatusPagamento } from '../../domain/status-pagamento.enum';

const MOTIVO_RECUSA_PADRAO = 'o banco não autorizou. Tente outro cartão ou pague com Pix.';

const MOTIVOS_RECUSA: Record<string, string> = {
  cc_rejected_bad_filled_card_number: 'confira o número do cartão.',
  cc_rejected_bad_filled_date: 'confira a data de vencimento.',
  cc_rejected_bad_filled_security_code: 'confira o código de segurança.',
  cc_rejected_bad_filled_other: 'confira os dados do cartão.',
  cc_rejected_call_for_authorize:
    'o banco pediu autorização. Fale com ele e tente de novo, ou use outro cartão.',
  cc_rejected_card_disabled: 'o cartão está inativo. Fale com o banco ou use outro cartão.',
  cc_rejected_duplicated_payment:
    'já existe um pagamento igual a este. Confira seu extrato antes de tentar de novo.',
  cc_rejected_insufficient_amount: 'saldo ou limite insuficiente. Tente outro cartão ou Pix.',
  cc_rejected_invalid_installments: 'o cartão não aceita esse número de parcelas.',
  cc_rejected_max_attempts: 'limite de tentativas atingido. Use outro cartão ou Pix.',
};

/** Texto pro cliente a partir do status_detail de um pagamento recusado. */
export function mensagemRecusaMercadoPago(statusDetail?: string | null): string {
  return (statusDetail && MOTIVOS_RECUSA[statusDetail]) || MOTIVO_RECUSA_PADRAO;
}

/**
 * Mapeia o status (e status_detail) retornado pela API de pagamentos do Mercado
 * Pago para o enum de domínio. Referência: status possíveis da API de Payments —
 * pending, approved, authorized, in_process, in_mediation, rejected, cancelled,
 * refunded, charged_back.
 *
 * Pix expirado normalmente chega como status "cancelled" com status_detail
 * relacionado a expiração — como o Mercado Pago não documenta um status_detail
 * fixo para isso, validar esse mapeamento contra um pagamento Pix expirado real
 * antes de ir para produção.
 */
export function mapearStatusMercadoPago(
  status: string,
  statusDetail?: string | null,
): StatusPagamento {
  switch (status) {
    case 'approved':
    case 'authorized':
      return StatusPagamento.APROVADO;
    case 'pending':
      return StatusPagamento.PENDENTE;
    case 'in_process':
    case 'in_mediation':
      return StatusPagamento.EM_PROCESSAMENTO;
    case 'rejected':
      return StatusPagamento.RECUSADO;
    case 'refunded':
    case 'charged_back':
      return StatusPagamento.ESTORNADO;
    case 'cancelled':
      if (statusDetail && /expir/i.test(statusDetail)) {
        return StatusPagamento.EXPIRADO;
      }
      return StatusPagamento.CANCELADO;
    default:
      return StatusPagamento.PENDENTE;
  }
}
