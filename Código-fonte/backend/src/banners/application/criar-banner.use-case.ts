import { Injectable } from '@nestjs/common';
import { Banner } from '../domain/banner.entity';
import { BannerRepository, DadosCriacaoBanner } from '../domain/banner.repository';

@Injectable()
export class CriarBannerUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async executar(dados: DadosCriacaoBanner): Promise<Banner> {
    return this.bannerRepository.criar(dados);
  }
}
