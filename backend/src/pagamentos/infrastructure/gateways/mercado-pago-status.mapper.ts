import { StatusPagamento } from '../../domain/status-pagamento.enum';

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
export function mapearStatusMercadoPago(status: string, statusDetail?: string | null): StatusPagamento {
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
