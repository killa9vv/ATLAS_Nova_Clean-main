import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListarCuponsUseCase } from '../application/listar-cupons.use-case';
import { CriarCupomUseCase } from '../application/criar-cupom.use-case';
import { AtualizarCupomUseCase } from '../application/atualizar-cupom.use-case';
import { CriarCupomDto } from './dto/criar-cupom.dto';
import { AtualizarCupomDto } from './dto/atualizar-cupom.dto';
import { CupomResponseDto } from './dto/cupom-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

// Admin-only inteiro (diferente de Produtos/Marcas, que listam público): um
// código de cupom válido é informação sensível — listar publicamente vazaria
// todos os cupons ativos pra qualquer um, sem precisar "adivinhar" nenhum.
@ApiTags('cupons')
@Controller('cupons')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.ADMIN)
export class CuponsController {
  constructor(
    private readonly listarCuponsUseCase: ListarCuponsUseCase,
    private readonly criarCupomUseCase: CriarCupomUseCase,
    private readonly atualizarCupomUseCase: AtualizarCupomUseCase,
  ) {}

  @Get()
  async listar(): Promise<CupomResponseDto[]> {
    const cupons = await this.listarCuponsUseCase.executar();
    return cupons.map(CupomResponseDto.fromDomain);
  }

  @Post()
  async criar(@Body() dto: CriarCupomDto): Promise<CupomResponseDto> {
    const cupom = await this.criarCupomUseCase.executar(dto);
    return CupomResponseDto.fromDomain(cupom);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarCupomDto,
  ): Promise<CupomResponseDto> {
    const cupom = await this.atualizarCupomUseCase.executar(id, dto);
    return CupomResponseDto.fromDomain(cupom);
  }
}
