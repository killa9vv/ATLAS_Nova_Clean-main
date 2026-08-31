import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min, MaxLength } from 'class-validator';

export class CriarBannerDto {
  @ApiProperty({ example: 'Promoção de inverno', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  titulo!: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/atlas/image/upload/banner1.jpg' })
  @IsOptional()
  @IsUrl()
  imagemUrl?: string;

  @ApiPropertyOptional({ example: 'https://atlasnova.com/produtos?categoria=inverno' })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @ApiPropertyOptional({
    example: 0,
    minimum: 0,
    description: 'Ordem de exibição, menor primeiro.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordem?: number;
}
