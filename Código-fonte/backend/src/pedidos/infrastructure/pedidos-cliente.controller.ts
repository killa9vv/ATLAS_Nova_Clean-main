import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListarPedidosPorClienteUseCase } from '../application/listar-pedidos-por-cliente.use-case';
import { BuscarPedidoDoClienteUseCase } from '../application/buscar-pedido-do-cliente.use-case';
import { BuscarRastreioPedidoUseCase } from '../application/buscar-rastreio-pedido.use-case';
import { RepetirPedidoUseCase } from '../application/repetir-pedido.use-case';
import { ListarMeusPedidosQueryDto } from './dto/listar-meus-pedidos-query.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';
import { MeusPedidosResponseDto } from './dto/meus-pedidos-response.dto';
import { RastreioPedidoResponseDto } from './dto/rastreio-pedido-response.dto';
import { RepetirPedidoResponseDto } from './dto/repetir-pedido-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { ClienteAtual } from '../../auth/infrastructure/decorators/cliente-atual.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

// "Meus pedidos" — só os do próprio cliente autenticado (clienteId sempre do JWT).
// Separado de PedidosController (que é admin-only pra listagem/detalhe completos)
// porque a regra de autorização é fundamentalmente diferente: aqui é "é seu",
// lá é "você é staff".
@ApiTags('pedidos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.CLIENTE)
@Controller('clientes/me/pedidos')
export class PedidosClienteController {
  constructor(
    private readonly listarPedidosPorClienteUseCase: ListarPedidosPorClienteUseCase,
    private readonly buscarPedidoDoClienteUseCase: BuscarPedidoDoClienteUseCase,
    private readonly buscarRastreioPedidoUseCase: BuscarRastreioPedidoUseCase,
    private readonly repetirPedidoUseCase: RepetirPedidoUseCase,
  ) {}

  @Get()
  async listar(
    @ClienteAtual() clienteId: string,
    @Query() query: ListarMeusPedidosQueryDto,
  ): Promise<MeusPedidosResponseDto> {
    const resultado = await this.listarPedidosPorClienteUseCase.executar(clienteId, query);
    return MeusPedidosResponseDto.fromDomain(resultado);
  }

  @Get(':id')
  async buscarPorId(
    @ClienteAtual() clienteId: string,
    @Param('id') id: string,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.buscarPedidoDoClienteUseCase.executar(id, clienteId);
    return PedidoResponseDto.fromDomain(pedido);
  }

  @Get(':id/rastreio')
  async rastreio(
    @ClienteAtual() clienteId: string,
    @Param('id') id: string,
  ): Promise<RastreioPedidoResponseDto> {
    const rastreio = await this.buscarRastreioPedidoUseCase.executar(id, clienteId);
    return RastreioPedidoResponseDto.fromDomain(rastreio);
  }

  @Post(':id/repetir')
  async repetir(
    @ClienteAtual() clienteId: string,
    @Param('id') id: string,
  ): Promise<RepetirPedidoResponseDto> {
    const resultado = await this.repetirPedidoUseCase.executar(id, clienteId);
    return RepetirPedidoResponseDto.fromDomain(resultado);
  }
}
