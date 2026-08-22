import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ListarProdutosUseCase } from '../application/listar-produtos.use-case';
import { BuscarProdutoPorIdUseCase } from '../application/buscar-produto-por-id.use-case';
import { BuscarProdutoPorSlugUseCase } from '../application/buscar-produto-por-slug.use-case';
import { CriarProdutoUseCase } from '../application/criar-produto.use-case';
import { AtualizarProdutoUseCase } from '../application/atualizar-produto.use-case';
import { AlternarStatusProdutoUseCase } from '../application/alternar-status-produto.use-case';
import { CriarProdutoDto } from './dto/criar-produto.dto';
import { AtualizarProdutoDto } from './dto/atualizar-produto.dto';
import { ListarProdutosQueryDto } from './dto/listar-produtos-query.dto';
import { ProdutoResponseDto } from './dto/produto-response.dto';
import { ProdutoPaginadoResponseDto } from './dto/produto-paginado-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

@Controller('produtos')
export class ProdutosController {
  constructor(
    private readonly listarProdutosUseCase: ListarProdutosUseCase,
    private readonly buscarProdutoPorIdUseCase: BuscarProdutoPorIdUseCase,
    private readonly buscarProdutoPorSlugUseCase: BuscarProdutoPorSlugUseCase,
    private readonly criarProdutoUseCase: CriarProdutoUseCase,
    private readonly atualizarProdutoUseCase: AtualizarProdutoUseCase,
    private readonly alternarStatusProdutoUseCase: AlternarStatusProdutoUseCase,
  ) {}

  @Get()
  async listar(@Query() query: ListarProdutosQueryDto): Promise<ProdutoPaginadoResponseDto> {
    const resultado = await this.listarProdutosUseCase.executar(query);
    return ProdutoPaginadoResponseDto.fromDomain(resultado);
  }

  @Get('slug/:slug')
  async buscarPorSlug(@Param('slug') slug: string): Promise<ProdutoResponseDto> {
    const produto = await this.buscarProdutoPorSlugUseCase.executar(slug);
    return ProdutoResponseDto.fromDomain(produto);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string): Promise<ProdutoResponseDto> {
    const produto = await this.buscarProdutoPorIdUseCase.executar(id);
    return ProdutoResponseDto.fromDomain(produto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async criar(@Body() dto: CriarProdutoDto): Promise<ProdutoResponseDto> {
    const produto = await this.criarProdutoUseCase.executar(dto);
    return ProdutoResponseDto.fromDomain(produto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarProdutoDto,
  ): Promise<ProdutoResponseDto> {
    const produto = await this.atualizarProdutoUseCase.executar(id, dto);
    return ProdutoResponseDto.fromDomain(produto);
  }

  @Patch(':id/ativar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async ativar(@Param('id') id: string): Promise<ProdutoResponseDto> {
    const produto = await this.alternarStatusProdutoUseCase.ativar(id);
    return ProdutoResponseDto.fromDomain(produto);
  }

  @Patch(':id/desativar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async desativar(@Param('id') id: string): Promise<ProdutoResponseDto> {
    const produto = await this.alternarStatusProdutoUseCase.desativar(id);
    return ProdutoResponseDto.fromDomain(produto);
  }
}
