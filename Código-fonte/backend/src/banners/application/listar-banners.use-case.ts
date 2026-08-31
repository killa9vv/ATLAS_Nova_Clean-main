import { Injectable } from '@nestjs/common';
import { Banner } from '../domain/banner.entity';
import { BannerRepository } from '../domain/banner.repository';

@Injectable()
export class ListarBannersUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async executar(): Promise<Banner[]> {
    return this.bannerRepository.listarTodos();
  }
}
