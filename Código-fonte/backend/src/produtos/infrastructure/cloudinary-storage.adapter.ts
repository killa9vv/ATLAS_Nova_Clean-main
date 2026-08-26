import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ImageStorage, ResultadoUploadImagem } from '../domain/image-storage.port';

@Injectable()
export class CloudinaryStorageAdapter extends ImageStorage {
  constructor(configService: ConfigService) {
    super();
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(arquivo: Buffer, pasta: string): Promise<ResultadoUploadImagem> {
    const resposta = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: pasta }, (erro, resultado) => {
        if (erro || !resultado) {
          reject(erro ?? new Error('Upload sem resposta do Cloudinary.'));
          return;
        }
        resolve(resultado);
      });
      Readable.from(arquivo).pipe(stream);
    });

    return { url: resposta.secure_url, providerId: resposta.public_id };
  }

  async remover(providerId: string): Promise<void> {
    await cloudinary.uploader.destroy(providerId);
  }
}
