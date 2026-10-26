const TRANSFORMACAO_THUMBNAIL = 'w_300,h_300,c_limit,q_auto,f_auto';

/** Insere a transformação do Cloudinary na URL de entrega — não gera/armazena outro
 * arquivo. Usado tanto no repositório (foto principal embutida na listagem de
 * produtos) quanto no DTO de imagens (galeria completa da página de detalhe). */
export function gerarUrlThumbnail(url: string): string {
  return url.replace('/upload/', `/upload/${TRANSFORMACAO_THUMBNAIL}/`);
}
