import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';
import { ListarPedidosUseCase } from '../application/listar-pedidos.use-case';
import { AtualizarStatusPedidoUseCase } from '../application/atualizar-status-pedido.use-case';
import { AtualizarRastreioPedidoUseCase } from '../application/atualizar-rastreio-pedido.use-case';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { AtualizarStatusPedidoDto } from './dto/atualizar-status-pedido.dto';
import { AtualizarRastreioPedidoDto } from './dto/atualizar-rastreio-pedido.dto';
import { ListarPedidosAdminQueryDto } from './dto/listar-pedidos-admin-query.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';
import { PedidoStatusResponseDto } from './dto/pedido-status-response.dto';
import { MeusPedidosResponseDto } from './dto/meus-pedidos-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/infrastructure/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

interface RequisicaoComClienteOpcional {
  user?: { id: string; papel: string };
}

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

  // Admin-only — painel administrativo (dashboard, gestão de pedidos), paginado e
  // filtrável por status/cliente/período.
  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async listar(@Query() query: ListarPedidosAdminQueryDto): Promise<MeusPedidosResponseDto> {
    const resultado = await this.listarPedidosUseCase.executar({
      pagina: query.pagina,
      limite: query.limite,
      status: query.status,
      clienteId: query.clienteId,
      dataInicio: query.dataInicio ? new Date(query.dataInicio) : undefined,
      dataFim: query.dataFim ? new Date(query.dataFim) : undefined,
    });
    return MeusPedidosResponseDto.fromDomain(resultado);
  }

  // Público de propósito: checkout de convidado continua funcionando sem login
  // (Pedido.clienteId é opcional — ver schema.prisma), inclusive "salvar meus dados"
  // (cliente sem senha, criado na hora — dto.clienteId aqui é ele, não uma conta real).
  // Com OptionalJwtAuthGuard: se vier um Bearer token válido de cliente (conta de
  // verdade, com senha), o pedido é vinculado a ELE (request.user.id, do JWT) — nunca
  // ao dto.clienteId, que não tem como provar que é de quem está autenticado. Só cai
  // pro dto.clienteId quando a requisição é mesmo anônima.
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async criar(
    @Body() dto: CriarPedidoDto,
    @Req() request: RequisicaoComClienteOpcional,
  ): Promise<PedidoResponseDto> {
    const clienteId =
      request.user?.papel === PapelUsuario.CLIENTE ? request.user.id : dto.clienteId;

    const pedido = await this.criarPedidoUseCase.executar(
      dto.itens,
      { tipoEntrega: dto.tipoEntrega, endereco: dto.endereco },
      dto.contato,
      clienteId,
      dto.canal,
      dto.cupomCodigo,
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
