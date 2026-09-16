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
import { ListarCategoriasUseCase } from '../application/listar-categorias.use-case';
import { CriarCategoriaUseCase } from '../application/criar-categoria.use-case';
import { AtualizarCategoriaUseCase } from '../application/atualizar-categoria.use-case';
import { ExcluirCategoriaUseCase } from '../application/excluir-categoria.use-case';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CategoriaResponseDto } from './dto/categoria-response.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

@ApiTags('categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(
    private readonly listarCategoriasUseCase: ListarCategoriasUseCase,
    private readonly criarCategoriaUseCase: CriarCategoriaUseCase,
    private readonly atualizarCategoriaUseCase: AtualizarCategoriaUseCase,
    private readonly excluirCategoriaUseCase: ExcluirCategoriaUseCase,
  ) {}

  @Get()
  @ApiQuery({
    name: 'ativo',
    required: false,
    description: 'String "true"/"false". Se omitido, retorna ativas e inativas.',
  })
  async listar(@Query('ativo') ativo?: string): Promise<CategoriaResponseDto[]> {
    const categorias = await this.listarCategoriasUseCase.executar(
      ativo !== undefined ? ativo === 'true' : undefined,
    );
    return categorias.map(CategoriaResponseDto.fromDomain);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async criar(@Body() dto: CriarCategoriaDto): Promise<CategoriaResponseDto> {
    const categoria = await this.criarCategoriaUseCase.executar(dto.nome);
    return CategoriaResponseDto.fromDomain(categoria);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarCategoriaDto,
  ): Promise<CategoriaResponseDto> {
    const categoria = await this.atualizarCategoriaUseCase.executar(id, dto.nome, dto.ativo);
    return CategoriaResponseDto.fromDomain(categoria);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async excluir(@Param('id') id: string): Promise<void> {
    await this.excluirCategoriaUseCase.executar(id);
  }
}
