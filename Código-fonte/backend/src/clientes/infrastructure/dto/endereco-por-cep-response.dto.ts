import { ApiProperty } from '@nestjs/swagger';
import { EnderecoPorCep } from '../../domain/cep-lookup.port';

export class EnderecoPorCepResponseDto {
  @ApiProperty({ example: '28013-000' })
  cep: string;

  @ApiProperty({ example: 'Rua do Sol' })
  logradouro: string;

  @ApiProperty({ example: 'Centro' })
  bairro: string;

  @ApiProperty({ example: 'Campos dos Goytacazes' })
  cidade: string;

  @ApiProperty({ example: 'RJ' })
  estado: string;

  static fromDomain(endereco: EnderecoPorCep): EnderecoPorCepResponseDto {
    const dto = new EnderecoPorCepResponseDto();
    dto.cep = endereco.cep;
    dto.logradouro = endereco.logradouro;
    dto.bairro = endereco.bairro;
    dto.cidade = endereco.cidade;
    dto.estado = endereco.estado;
    return dto;
  }
}
