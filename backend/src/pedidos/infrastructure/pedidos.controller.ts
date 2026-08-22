import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CriarPedidoUseCase } from '../application/criar-pedido.use-case';
import { BuscarPedidoPorIdUseCase } from '../application/buscar-pedido-por-id.use-case';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { PedidoResponseDto } from './dto/pedido-response.dto';

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly criarPedidoUseCase: CriarPedidoUseCase,
    private readonly buscarPedidoPorIdUseCase: BuscarPedidoPorIdUseCase,
  ) {}

  @Post()
  async criar(@Body() dto: CriarPedidoDto): Promise<PedidoResponseDto> {
    const pedido = await this.criarPedidoUseCase.executar(dto.itens);
    return PedidoResponseDto.fromDomain(pedido);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string): Promise<PedidoResponseDto> {
    const pedido = await this.buscarPedidoPorIdUseCase.executar(id);
    return PedidoResponseDto.fromDomain(pedido);
  }
}
