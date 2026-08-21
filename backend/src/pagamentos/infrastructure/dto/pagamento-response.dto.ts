import { CriarPagamentoOutput } from '../../application/dto/criar-pagamento-input';

export class PagamentoResponseDto {
  pagamentoId: string;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;

  static fromOutput(output: CriarPagamentoOutput): PagamentoResponseDto {
    const dto = new PagamentoResponseDto();
    dto.pagamentoId = output.pagamentoId;
    dto.status = output.status;
    dto.qrCode = output.qrCode;
    dto.qrCodeBase64 = output.qrCodeBase64;
    return dto;
  }
}
