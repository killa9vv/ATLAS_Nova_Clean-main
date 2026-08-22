import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly criarPedidoUseCase: CriarPedidoUseCase,
    private readonly buscarPedidoPorIdUseCase: BuscarPedidoPorIdUseCase,
  ) {}

  // Público de propósito: checkout de convidado, sem exigir login de cliente
  // (Pedido.clienteId é opcional — ver schema.prisma). Não há hoje sistema de
  // login para clientes, só para staff (Usuario/ADMIN).
  @Post()
  async criar(@Body() dto: CriarPedidoDto): Promise<PedidoResponseDto> {
    const pedido = await this.criarPedidoUseCase.executar(dto.itens);
    return PedidoResponseDto.fromDomain(pedido);
  }

  // Antes não tinha guard nenhum: qualquer um adivinhando/enumerando um UUID
  // via GET via aqui via essa rota conseguia ver os itens e o total de
  // qualquer pedido de qualquer pessoa. Como não existe login de cliente pra
  // provar "dono do recurso", restringe a admin até essa lacuna ser resolvida.
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async buscarPorId(@Param('id') id: string): Promise<PedidoResponseDto> {
    const pedido = await this.buscarPedidoPorIdUseCase.executar(id);
    return PedidoResponseDto.fromDomain(pedido);
  }
}
