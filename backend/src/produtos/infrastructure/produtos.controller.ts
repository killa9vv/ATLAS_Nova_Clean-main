// Endpoints HTTP de produtos: listagem e busca por id.
import { Controller, Get, Param } from '@nestjs/common';
import { ListarProdutosUseCase } from '../application/listar-produtos.use-case';
import { BuscarProdutoPorIdUseCase } from '../application/buscar-produto-por-id.use-case';
import { ProdutoResponseDto } from './dto/produto-response.dto';

@Controller('produtos')
export class ProdutosController {
  constructor(
    private readonly listarProdutosUseCase: ListarProdutosUseCase,
    private readonly buscarProdutoPorIdUseCase: BuscarProdutoPorIdUseCase,
  ) {}

  @Get()
  async listar(): Promise<ProdutoResponseDto[]> {
    const produtos = await this.listarProdutosUseCase.executar();
    return produtos.map(ProdutoResponseDto.fromDomain);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string): Promise<ProdutoResponseDto> {
    const produto = await this.buscarProdutoPorIdUseCase.executar(id);
    return ProdutoResponseDto.fromDomain(produto);
  }
}
