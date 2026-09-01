import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Marca } from '../../domain/marca.entity';

export class MarcaResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ example: 'Ypê' })
  nome: string;

  @ApiPropertyOptional({ example: '/brands/ype.png' })
  imagemUrl?: string;

  static fromDomain(marca: Marca): MarcaResponseDto {
    const dto = new MarcaResponseDto();
    dto.id = marca.id;
    dto.nome = marca.nome;
    dto.imagemUrl = marca.imagemUrl;
    return dto;
  }
}
