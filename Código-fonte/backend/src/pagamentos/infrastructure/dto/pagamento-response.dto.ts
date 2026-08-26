import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CriarPagamentoOutput } from '../../application/dto/criar-pagamento-input';

export class PagamentoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  pagamentoId: string;

  @ApiProperty({ example: 'PENDENTE' })
  status: string;

  @ApiPropertyOptional({ description: 'Presente apenas para pagamentos via Pix.' })
  qrCode?: string;

  @ApiPropertyOptional({ description: 'QR Code Pix em base64 (imagem), presente apenas para Pix.' })
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
