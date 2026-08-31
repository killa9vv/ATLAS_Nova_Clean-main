import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';
import { ListarPedidosUseCase } from '../application/listar-pedidos.use-case';
import { AtualizarStatusPedidoUseCase } from '../application/atualizar-status-pedido.use-case';
import { AtualizarRastreioPedidoUseCase } from '../application/atualizar-rastreio-pedido.use-case';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusPedidoDto } from './dto/atualizar-status-pedido.dto';
import { AtualizarRastreioPedidoDto } from './dto/atualizar-rastreio-pedido.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';
import { PedidoStatusResponseDto } from './dto/pedido-status-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

@ApiTags('pedidos')
@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly criarPedidoUseCase: CriarPedidoUseCase,
    private readonly buscarPedidoPorIdUseCase: BuscarPedidoPorIdUseCase,
    private readonly listarPedidosUseCase: ListarPedidosUseCase,
    private readonly atualizarStatusPedidoUseCase: AtualizarStatusPedidoUseCase,
    private readonly atualizarRastreioPedidoUseCase: AtualizarRastreioPedidoUseCase,
  ) {}

  // Admin-only — painel administrativo (dashboard, gestão de pedidos). Mesma
  // restrição de buscarPorId abaixo: sem login de cliente, não dá pra saber
  // "dono" de cada pedido, então listar tudo fica restrito a staff.
  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async listar(): Promise<PedidoResponseDto[]> {
    const pedidos = await this.listarPedidosUseCase.executar();
    return pedidos.map(PedidoResponseDto.fromDomain);
  }

  // Público de propósito: checkout de convidado, sem exigir login de cliente
  // (Pedido.clienteId é opcional — ver schema.prisma). Não há hoje sistema de
  // login para clientes, só para staff (Usuario/ADMIN).
  @Post()
  async criar(@Body() dto: CriarPedidoDto): Promise<PedidoResponseDto> {
    const pedido = await this.criarPedidoUseCase.executar(
      dto.itens,
      { tipoEntrega: dto.tipoEntrega, endereco: dto.endereco },
      dto.canal,
    );
    return PedidoResponseDto.fromDomain(pedido);
  }

  // Antes não tinha guard nenhum: qualquer um adivinhando/enumerando um UUID
  // via GET via aqui via essa rota conseguia ver os itens e o total de
  // qualquer pedido de qualquer pessoa. Como não existe login de cliente pra
  // provar "dono do recurso", restringe a admin até essa lacuna ser resolvida.
  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async buscarPorId(@Param('id') id: string): Promise<PedidoResponseDto> {
    const pedido = await this.buscarPedidoPorIdUseCase.executar(id);
    return PedidoResponseDto.fromDomain(pedido);
  }

  // Público de propósito, igual ao POST acima: o checkout de convidado (sem login de
  // cliente) precisa saber o total antes de pagar e acompanhar o status depois (Pix).
  // Só existe porque a resposta é mínima (status + total, nada de PII) e o id é um
  // UUID v4 — inviável de adivinhar. Se Pedido um dia passar a guardar dado do
  // cliente, isso continua seguro só por não expor esse dado aqui; buscarPorId acima
  // segue admin-only pra qualquer coisa mais completa.
  @Get(':id/status')
  async buscarStatus(@Param('id') id: string): Promise<PedidoStatusResponseDto> {
    const pedido = await this.buscarPedidoPorIdUseCase.executar(id);
    return PedidoStatusResponseDto.fromDomain(pedido);
  }

  // Admin-only — só algumas transições são aceitas (ver AtualizarStatusPedidoUseCase);
  // fora delas o use case lança PedidoEmStatusInvalidoException (409).
  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async atualizarStatus(
    @Param('id') id: string,
    @Body() dto: AtualizarStatusPedidoDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.atualizarStatusPedidoUseCase.executar(id, dto.status);
    return PedidoResponseDto.fromDomain(pedido);
  }

  @Patch(':id/rastreio')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async atualizarRastreio(
    @Param('id') id: string,
    @Body() dto: AtualizarRastreioPedidoDto,
  ): Promise<PedidoResponseDto> {
    const pedido = await this.atualizarRastreioPedidoUseCase.executar(
      id,
      dto.codigoRastreio ?? null,
    );
    return PedidoResponseDto.fromDomain(pedido);
  }
}
