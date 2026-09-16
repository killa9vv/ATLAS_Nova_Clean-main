import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListarMarcasUseCase } from '../application/listar-marcas.use-case';
import { CriarMarcaUseCase } from '../application/criar-marca.use-case';
import { AtualizarMarcaUseCase } from '../application/atualizar-marca.use-case';
import { ExcluirMarcaUseCase } from '../application/excluir-marca.use-case';
import { CriarMarcaDto } from './dto/criar-marca.dto';
import { AtualizarMarcaDto } from './dto/atualizar-marca.dto';
import { MarcaResponseDto } from './dto/marca-response.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

@ApiTags('marcas')
@Controller('marcas')
export class MarcasController {
  constructor(
    private readonly listarMarcasUseCase: ListarMarcasUseCase,
    private readonly criarMarcaUseCase: CriarMarcaUseCase,
    private readonly atualizarMarcaUseCase: AtualizarMarcaUseCase,
    private readonly excluirMarcaUseCase: ExcluirMarcaUseCase,
  ) {}

  @Get()
  @ApiQuery({
    name: 'ativo',
    required: false,
    description: 'String "true"/"false". Se omitido, retorna ativas e inativas.',
  })
  async listar(@Query('ativo') ativo?: string): Promise<MarcaResponseDto[]> {
    const marcas = await this.listarMarcasUseCase.executar(
      ativo !== undefined ? ativo === 'true' : undefined,
    );
    return marcas.map(MarcaResponseDto.fromDomain);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async criar(@Body() dto: CriarMarcaDto): Promise<MarcaResponseDto> {
    const marca = await this.criarMarcaUseCase.executar(dto.nome);
    return MarcaResponseDto.fromDomain(marca);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarMarcaDto,
  ): Promise<MarcaResponseDto> {
    const marca = await this.atualizarMarcaUseCase.executar(id, dto.nome, dto.ativo);
    return MarcaResponseDto.fromDomain(marca);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async excluir(@Param('id') id: string): Promise<void> {
    await this.excluirMarcaUseCase.executar(id);
  }
}
