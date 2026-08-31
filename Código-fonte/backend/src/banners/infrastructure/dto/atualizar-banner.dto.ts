import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Min, MaxLength } from 'class-validator';

export class AtualizarBannerDto {
  @ApiPropertyOptional({ example: 'Promoção de inverno', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titulo?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/atlas/image/upload/banner1.jpg' })
  @IsOptional()
  @IsUrl()
  imagemUrl?: string;

  @ApiPropertyOptional({ example: 'https://atlasnova.com/produtos?categoria=inverno' })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
