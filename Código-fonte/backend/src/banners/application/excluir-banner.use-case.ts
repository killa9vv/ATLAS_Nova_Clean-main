import { Injectable } from '@nestjs/common';
import { BannerRepository } from '../domain/banner.repository';
import { BannerNaoEncontradoException } from '../domain/banners.exceptions';

@Injectable()
export class ExcluirBannerUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async executar(id: string): Promise<void> {
    const existente = await this.bannerRepository.buscarPorId(id);
    if (!existente) {
      throw new BannerNaoEncontradoException(id);
    }

    await this.bannerRepository.excluir(id);
  }
}
