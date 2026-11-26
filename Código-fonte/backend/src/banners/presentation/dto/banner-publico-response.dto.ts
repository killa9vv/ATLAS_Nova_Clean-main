import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Banner } from '../../domain/banner.entity';

/** Só o que a vitrine desenha: ativo, ordem e datas são assunto do painel. */
export class BannerPublicoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id!: string;

  @ApiProperty({ example: 'Promoção de inverno' })
  titulo!: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/atlas/image/upload/banner1.jpg' })
  imagemUrl?: string;

  @ApiPropertyOptional({ example: 'https://atlasnova.com/produtos?categoria=inverno' })
  linkUrl?: string;

  static fromDomain(banner: Banner): BannerPublicoResponseDto {
    const dto = new BannerPublicoResponseDto();
    dto.id = banner.id;
    dto.titulo = banner.titulo;
    dto.imagemUrl = banner.imagemUrl;
    dto.linkUrl = banner.linkUrl;
    return dto;
  }
}
