// Reduz e comprime a foto no navegador antes do upload. Foto de celular costuma ter
// 3–8MB (passava do limite de 5MB do backend e demorava pra subir); a vitrine nunca
// mostra mais que ~1600px, então reduzir aqui não perde nada visível. WebP mantém
// transparência (PNG com fundo removido continua transparente).
//
// Em qualquer problema (navegador sem suporte a WebP no canvas, arquivo que não
// decodifica etc.) devolve o arquivo original — o backend valida do mesmo jeito.

const LADO_MAXIMO_PX = 1600;
const QUALIDADE_WEBP = 0.85;

export async function comprimirImagem(arquivo: File): Promise<File> {
  try {
    // createImageBitmap já respeita a orientação EXIF (foto "deitada" do celular).
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext('2d');
    if (!contexto) {
      bitmap.close();
      return arquivo;
    }
    contexto.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALIDADE_WEBP),
    );
    // Safari antigo devolve PNG em vez de WebP; e às vezes o original já é menor.
    if (!blob || blob.type !== 'image/webp' || blob.size >= arquivo.size) {
      return arquivo;
    }

    const nome = arquivo.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], nome, { type: 'image/webp' });
  } catch {
    return arquivo;
  }
}
