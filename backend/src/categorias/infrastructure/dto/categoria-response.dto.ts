import { ApiProperty } from '@nestjs/swagger';
import { Categoria } from '../../domain/categoria.entity';

export class CategoriaResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ example: 'limpeza' })
  slug: string;

  @ApiProperty({ example: 'Limpeza' })
  nome: string;

  static fromDomain(categoria: Categoria): CategoriaResponseDto {
    const dto = new CategoriaResponseDto();
    dto.id = categoria.id;
    dto.slug = categoria.slug;
    dto.nome = categoria.nome;
    return dto;
  }
}
