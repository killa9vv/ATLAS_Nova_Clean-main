import { Module } from '@nestjs/common';
import { BannersController } from './banners.controller';
import { PrismaBannerRepository } from './prisma-banner.repository';
import { BannerRepository } from '../domain/banner.repository';
import { ListarBannersUseCase } from '../application/listar-banners.use-case';
import { CriarBannerUseCase } from '../application/criar-banner.use-case';
import { AtualizarBannerUseCase } from '../application/atualizar-banner.use-case';
import { ExcluirBannerUseCase } from '../application/excluir-banner.use-case';

@Module({
  controllers: [BannersController],
  providers: [
    { provide: BannerRepository, useClass: PrismaBannerRepository },
    ListarBannersUseCase,
    CriarBannerUseCase,
    AtualizarBannerUseCase,
    ExcluirBannerUseCase,
  ],
  exports: [BannerRepository],
})
export class BannersModule {}
