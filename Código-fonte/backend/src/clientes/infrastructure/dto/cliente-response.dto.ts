import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Cliente } from '../../domain/cliente.entity';

export class ClienteResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ example: 'Maria da Silva' })
  nome: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '(22) 99999-8888' })
  telefone?: string;

  @ApiPropertyOptional({ example: '12345678909' })
  cpf?: string;

  @ApiPropertyOptional({ example: '12345678000195' })
  cnpj?: string;

  static fromDomain(cliente: Cliente): ClienteResponseDto {
    const dto = new ClienteResponseDto();
    dto.id = cliente.id;
    dto.nome = cliente.nome;
    dto.email = cliente.email;
    dto.telefone = cliente.telefone;
    dto.cpf = cliente.cpf;
    dto.cnpj = cliente.cnpj;
    return dto;
  }
}
