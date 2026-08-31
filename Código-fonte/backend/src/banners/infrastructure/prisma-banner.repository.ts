import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Banner } from '../domain/banner.entity';
import {
  BannerRepository,
  DadosAtualizacaoBanner,
  DadosCriacaoBanner,
} from '../domain/banner.repository';
import type { Banner as BannerPrisma } from '@prisma/client';

@Injectable()
export class PrismaBannerRepository extends BannerRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodos(): Promise<Banner[]> {
    const banners = await this.prisma.banner.findMany({
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
    });
    return banners.map((banner) => this.paraDominio(banner));
  }

  async buscarPorId(id: string): Promise<Banner | null> {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    return banner ? this.paraDominio(banner) : null;
  }

  async criar(dados: DadosCriacaoBanner): Promise<Banner> {
    const banner = await this.prisma.banner.create({
      data: {
        titulo: dados.titulo,
        imagemUrl: dados.imagemUrl,
        linkUrl: dados.linkUrl,
        ordem: dados.ordem ?? 0,
      },
    });
    return this.paraDominio(banner);
  }

  async atualizar(id: string, dados: DadosAtualizacaoBanner): Promise<Banner> {
    const banner = await this.prisma.banner.update({
      where: { id },
      data: {
        titulo: dados.titulo,
        imagemUrl: dados.imagemUrl,
        linkUrl: dados.linkUrl,
        ordem: dados.ordem,
        ativo: dados.ativo,
      },
    });
    return this.paraDominio(banner);
  }

  async excluir(id: string): Promise<void> {
    await this.prisma.banner.delete({ where: { id } });
  }

  private paraDominio(banner: BannerPrisma): Banner {
    return new Banner(
      banner.id,
      banner.titulo,
      banner.ordem,
      banner.ativo,
      banner.createdAt,
      banner.updatedAt,
      banner.imagemUrl ?? undefined,
      banner.linkUrl ?? undefined,
    );
  }
}
