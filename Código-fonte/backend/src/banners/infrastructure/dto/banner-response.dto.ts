import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Banner } from '../../domain/banner.entity';

export class BannerResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id!: string;

  @ApiProperty({ example: 'Promoção de inverno' })
  titulo!: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/atlas/image/upload/banner1.jpg' })
  imagemUrl?: string;

  @ApiPropertyOptional({ example: 'https://atlasnova.com/produtos?categoria=inverno' })
  linkUrl?: string;

  @ApiProperty({ example: 0 })
  ordem!: number;

  @ApiProperty({ example: true })
  ativo!: boolean;

  @ApiProperty({ example: '2026-08-22T18:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-22T18:30:00.000Z' })
  updatedAt!: Date;

  static fromDomain(banner: Banner): BannerResponseDto {
    const dto = new BannerResponseDto();
    dto.id = banner.id;
    dto.titulo = banner.titulo;
    dto.imagemUrl = banner.imagemUrl;
    dto.linkUrl = banner.linkUrl;
    dto.ordem = banner.ordem;
    dto.ativo = banner.ativo;
    dto.createdAt = banner.createdAt;
    dto.updatedAt = banner.updatedAt;
    return dto;
  }
}
