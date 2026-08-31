import { Injectable } from '@nestjs/common';
import { Banner } from '../domain/banner.entity';
import { BannerRepository, DadosAtualizacaoBanner } from '../domain/banner.repository';
import { BannerNaoEncontradoException } from '../domain/banners.exceptions';

@Injectable()
export class AtualizarBannerUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async executar(id: string, dados: DadosAtualizacaoBanner): Promise<Banner> {
    const existente = await this.bannerRepository.buscarPorId(id);
    if (!existente) {
      throw new BannerNaoEncontradoException(id);
    }

    return this.bannerRepository.atualizar(id, dados);
  }
}
