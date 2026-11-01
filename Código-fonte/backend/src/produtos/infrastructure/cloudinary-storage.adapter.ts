import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ImageStorage, ResultadoUploadImagem } from '../domain/image-storage.port';

@Injectable()
export class CloudinaryStorageAdapter extends ImageStorage {
  private readonly logger = new Logger(CloudinaryStorageAdapter.name);
  private readonly removerFundo: boolean;

  constructor(configService: ConfigService) {
    super();
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
    // Ligado por padrão (comportamento que já existia); CLOUDINARY_REMOVER_FUNDO=false
    // desliga — o add-on de IA tem cota mensal pequena no plano grátis.
    this.removerFundo = configService.get<string>('CLOUDINARY_REMOVER_FUNDO') !== 'false';
  }

  // Remove o fundo da foto na hora do upload (add-on de IA do Cloudinary) — o asset
  // armazenado já sai sem fundo, então toda transformação derivada (thumbnail,
  // galeria) herda isso automaticamente. Se a remoção der erro (cota do add-on
  // esgotada, add-on desligado na conta), a foto sobe mesmo assim, com fundo: um
  // produto sem foto é pior que uma foto com fundo. O erro vai pro log/Sentry pra
  // alguém decidir (aumentar cota ou desligar a remoção).
  async upload(arquivo: Buffer, pasta: string): Promise<ResultadoUploadImagem> {
    if (!this.removerFundo) {
      return this.enviar(arquivo, pasta, false);
    }
    try {
      return await this.enviar(arquivo, pasta, true);
    } catch (erro) {
      this.logger.error(
        `Upload com remoção de fundo falhou (${(erro as Error)?.message ?? erro}) — enviando a foto sem remover o fundo.`,
      );
      return this.enviar(arquivo, pasta, false);
    }
  }

  private async enviar(
    arquivo: Buffer,
    pasta: string,
    removerFundo: boolean,
  ): Promise<ResultadoUploadImagem> {
    const resposta = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        removerFundo ? { folder: pasta, background_removal: 'cloudinary_ai' } : { folder: pasta },
        (erro, resultado) => {
          if (erro || !resultado) {
            reject(erro ?? new Error('Upload sem resposta do Cloudinary.'));
            return;
          }
          resolve(resultado);
        },
      );
      Readable.from(arquivo).pipe(stream);
    });

    return { url: resposta.secure_url, providerId: resposta.public_id };
  }

  async remover(providerId: string): Promise<void> {
    await cloudinary.uploader.destroy(providerId);
  }
}
