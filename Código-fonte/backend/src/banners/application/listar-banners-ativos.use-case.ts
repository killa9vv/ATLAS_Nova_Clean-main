import { Injectable } from '@nestjs/common';
import { Banner } from '../domain/banner.entity';
import { BannerRepository } from '../domain/banner.repository';

/** O que a vitrine mostra no carrossel da home: só os ligados, na ordem do painel. São poucos
 * banners, então filtrar aqui sai mais simples que uma consulta própria no repositório. */
@Injectable()
export class ListarBannersAtivosUseCase {
  constructor(private readonly bannerRepository: BannerRepository) {}

  async executar(): Promise<Banner[]> {
    const banners = await this.bannerRepository.listarTodos();
    return banners.filter((banner) => banner.ativo);
  }
}
