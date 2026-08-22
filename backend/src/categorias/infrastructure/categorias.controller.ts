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
import { ListarCategoriasUseCase } from '../application/listar-categorias.use-case';
import { CriarCategoriaUseCase } from '../application/criar-categoria.use-case';
import { AtualizarCategoriaUseCase } from '../application/atualizar-categoria.use-case';
import { ExcluirCategoriaUseCase } from '../application/excluir-categoria.use-case';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CategoriaResponseDto } from './dto/categoria-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
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
  async listar(): Promise<CategoriaResponseDto[]> {
    const categorias = await this.listarCategoriasUseCase.executar();
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
    const categoria = await this.atualizarCategoriaUseCase.executar(id, dto.nome);
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
