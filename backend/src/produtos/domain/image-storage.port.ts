export interface ResultadoUploadImagem {
  url: string;
  /** Identificador do asset no provedor (ex: public_id do Cloudinary) — necessário pra removê-lo depois. */
  providerId: string;
}

/**
 * Porta de saída pra armazenamento de imagens. O domínio e a aplicação dependem só
 * desta abstração; o provedor concreto (Cloudinary, S3, etc.) fica isolado na infraestrutura.
 */
export abstract class ImageStorage {
  abstract upload(arquivo: Buffer, pasta: string): Promise<ResultadoUploadImagem>;
  abstract remover(providerId: string): Promise<void>;
}
