import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListarBannersAtivosUseCase } from '../application/listar-banners-ativos.use-case';
import { BannerPublicoResponseDto } from './dto/banner-publico-response.dto';

// Separado de BannersController porque lá tudo é admin-only (guard na classe inteira).
@ApiTags('banners')
@Controller('banners/ativos')
export class BannersPublicosController {
  constructor(private readonly listarBannersAtivosUseCase: ListarBannersAtivosUseCase) {}

  @Get()
  async listar(): Promise<BannerPublicoResponseDto[]> {
    const banners = await this.listarBannersAtivosUseCase.executar();
    return banners.map(BannerPublicoResponseDto.fromDomain);
  }
}
