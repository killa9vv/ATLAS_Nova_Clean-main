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
import { CriarEnderecoUseCase } from '../application/criar-endereco.use-case';
import { ListarEnderecosUseCase } from '../application/listar-enderecos.use-case';
import { AtualizarEnderecoUseCase } from '../application/atualizar-endereco.use-case';
import { ExcluirEnderecoUseCase } from '../application/excluir-endereco.use-case';
import { DefinirEnderecoPadraoUseCase } from '../application/definir-endereco-padrao.use-case';
import { CriarEnderecoDto } from './dto/criar-endereco.dto';
import { AtualizarEnderecoDto } from './dto/atualizar-endereco.dto';
import { EnderecoResponseDto } from './dto/endereco-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { ClienteAtual } from '../../auth/infrastructure/decorators/cliente-atual.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

// clienteId vem sempre do JWT (ClienteAtual), nunca de um :clienteId de URL — antes
// dessas rotas terem guard, a "posse" de um endereço era provada só por conhecer o
// clienteId na URL (qualquer um podia listar/editar/excluir endereço de qualquer
// cliente). Guard fecha essa lacuna de vez.
@ApiTags('clientes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.CLIENTE)
@Controller('clientes/me/enderecos')
export class EnderecosController {
  constructor(
    private readonly criarEnderecoUseCase: CriarEnderecoUseCase,
    private readonly listarEnderecosUseCase: ListarEnderecosUseCase,
    private readonly atualizarEnderecoUseCase: AtualizarEnderecoUseCase,
    private readonly excluirEnderecoUseCase: ExcluirEnderecoUseCase,
    private readonly definirEnderecoPadraoUseCase: DefinirEnderecoPadraoUseCase,
  ) {}

  @Post()
  async criar(
    @ClienteAtual() clienteId: string,
    @Body() dto: CriarEnderecoDto,
  ): Promise<EnderecoResponseDto> {
    const endereco = await this.criarEnderecoUseCase.executar({ ...dto, clienteId });
    return EnderecoResponseDto.fromDomain(endereco);
  }

  @Get()
  async listar(@ClienteAtual() clienteId: string): Promise<EnderecoResponseDto[]> {
    const enderecos = await this.listarEnderecosUseCase.executar(clienteId);
    return enderecos.map(EnderecoResponseDto.fromDomain);
  }

  @Put(':id')
  async atualizar(
    @ClienteAtual() clienteId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarEnderecoDto,
  ): Promise<EnderecoResponseDto> {
    const endereco = await this.atualizarEnderecoUseCase.executar(id, clienteId, dto);
    return EnderecoResponseDto.fromDomain(endereco);
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@ClienteAtual() clienteId: string, @Param('id') id: string): Promise<void> {
    await this.excluirEnderecoUseCase.executar(id, clienteId);
  }

  @Put(':id/padrao')
  async definirPadrao(
    @ClienteAtual() clienteId: string,
    @Param('id') id: string,
  ): Promise<EnderecoResponseDto> {
    const endereco = await this.definirEnderecoPadraoUseCase.executar(id, clienteId);
    return EnderecoResponseDto.fromDomain(endereco);
  }
}
