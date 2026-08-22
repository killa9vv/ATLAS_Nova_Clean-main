import { ApiProperty } from '@nestjs/swagger';
import { ImagemProduto } from '../../domain/imagem-produto.entity';

const TRANSFORMACAO_THUMBNAIL = 'w_300,h_300,c_fill,q_auto,f_auto';

/** Insere a transformação do Cloudinary na URL de entrega — não gera/armazena outro arquivo. */
function gerarUrlThumbnail(url: string): string {
  return url.replace('/upload/', `/upload/${TRANSFORMACAO_THUMBNAIL}/`);
}

export class ImagemProdutoResponseDto {
  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  id: string;

  @ApiProperty({ example: 'b3f1c2d4-5678-4abc-9def-0123456789ab' })
  produtoId: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/atlas/image/upload/v1/atlas-nova-clean/produtos/abc.jpg',
  })
  url: string;

  @ApiProperty({ description: 'URL com transformação Cloudinary pra thumbnail 300x300.' })
  thumbnailUrl: string;

  @ApiProperty({ example: 0 })
  ordem: number;

  @ApiProperty({ example: true, description: 'true quando ordem === 0.' })
  principal: boolean;

  static fromDomain(imagem: ImagemProduto): ImagemProdutoResponseDto {
    const dto = new ImagemProdutoResponseDto();
    dto.id = imagem.id;
    dto.produtoId = imagem.produtoId;
    dto.url = imagem.url;
    dto.thumbnailUrl = gerarUrlThumbnail(imagem.url);
    dto.ordem = imagem.ordem;
    dto.principal = imagem.ehPrincipal();
    return dto;
  }
}
