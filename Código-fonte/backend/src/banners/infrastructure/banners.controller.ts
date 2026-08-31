import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListarBannersUseCase } from '../application/listar-banners.use-case';
import { CriarBannerUseCase } from '../application/criar-banner.use-case';
import { AtualizarBannerUseCase } from '../application/atualizar-banner.use-case';
import { ExcluirBannerUseCase } from '../application/excluir-banner.use-case';
import { CriarBannerDto } from './dto/criar-banner.dto';
import { AtualizarBannerDto } from './dto/atualizar-banner.dto';
import { BannerResponseDto } from './dto/banner-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

// Admin-only inteiro: banners ainda não são consumidos pela vitrine pública
// (isso é escopo do card de Home/vitrine), então por ora só o painel admin
// gerencia e lê essa lista.
@ApiTags('banners')
@Controller('banners')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.ADMIN)
export class BannersController {
  constructor(
    private readonly listarBannersUseCase: ListarBannersUseCase,
    private readonly criarBannerUseCase: CriarBannerUseCase,
    private readonly atualizarBannerUseCase: AtualizarBannerUseCase,
    private readonly excluirBannerUseCase: ExcluirBannerUseCase,
  ) {}

  @Get()
  async listar(): Promise<BannerResponseDto[]> {
    const banners = await this.listarBannersUseCase.executar();
    return banners.map(BannerResponseDto.fromDomain);
  }

  @Post()
  async criar(@Body() dto: CriarBannerDto): Promise<BannerResponseDto> {
    const banner = await this.criarBannerUseCase.executar(dto);
    return BannerResponseDto.fromDomain(banner);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarBannerDto,
  ): Promise<BannerResponseDto> {
    const banner = await this.atualizarBannerUseCase.executar(id, dto);
    return BannerResponseDto.fromDomain(banner);
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    await this.excluirBannerUseCase.executar(id);
  }
}
