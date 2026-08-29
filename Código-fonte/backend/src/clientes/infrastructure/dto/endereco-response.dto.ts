import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Endereco } from '../../domain/endereco.entity';

export class EnderecoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ example: '28013-000' })
  cep: string;

  @ApiProperty({ example: 'Rua do Sol' })
  logradouro: string;

  @ApiProperty({ example: '123' })
  numero: string;

  @ApiPropertyOptional({ example: 'Apto 201' })
  complemento?: string;

  @ApiProperty({ example: 'Centro' })
  bairro: string;

  @ApiProperty({ example: 'Campos dos Goytacazes' })
  cidade: string;

  @ApiProperty({ example: 'RJ' })
  estado: string;

  @ApiProperty({ example: true })
  padrao: boolean;

  static fromDomain(endereco: Endereco): EnderecoResponseDto {
    const dto = new EnderecoResponseDto();
    dto.id = endereco.id;
    dto.cep = endereco.cep;
    dto.logradouro = endereco.logradouro;
    dto.numero = endereco.numero;
    dto.complemento = endereco.complemento;
    dto.bairro = endereco.bairro;
    dto.cidade = endereco.cidade;
    dto.estado = endereco.estado;
    dto.padrao = endereco.padrao;
    return dto;
  }
}
