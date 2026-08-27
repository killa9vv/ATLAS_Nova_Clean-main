import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CriarEnderecoUseCase } from '../application/criar-endereco.use-case';
import { ListarEnderecosUseCase } from '../application/listar-enderecos.use-case';
import { AtualizarEnderecoUseCase } from '../application/atualizar-endereco.use-case';
import { ExcluirEnderecoUseCase } from '../application/excluir-endereco.use-case';
import { DefinirEnderecoPadraoUseCase } from '../application/definir-endereco-padrao.use-case';
import { CriarEnderecoDto } from './dto/criar-endereco.dto';
import { AtualizarEnderecoDto } from './dto/atualizar-endereco.dto';
import { EnderecoResponseDto } from './dto/endereco-response.dto';

// Sub-recurso de Cliente (mesma convenção de ImagemProduto dentro de produtos/):
// a "dona" do endereço, pra fins de autorização, é a posse do clienteId (mesmo
// trade-off documentado em ClientesController — sem login de cliente ainda).
@ApiTags('clientes')
@Controller('clientes/:clienteId/enderecos')
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
    @Param('clienteId') clienteId: string,
    @Body() dto: CriarEnderecoDto,
  ): Promise<EnderecoResponseDto> {
    const endereco = await this.criarEnderecoUseCase.executar({ ...dto, clienteId });
    return EnderecoResponseDto.fromDomain(endereco);
  }

  @Get()
  async listar(@Param('clienteId') clienteId: string): Promise<EnderecoResponseDto[]> {
    const enderecos = await this.listarEnderecosUseCase.executar(clienteId);
    return enderecos.map(EnderecoResponseDto.fromDomain);
  }

  @Put(':id')
  async atualizar(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
    @Body() dto: AtualizarEnderecoDto,
  ): Promise<EnderecoResponseDto> {
    const endereco = await this.atualizarEnderecoUseCase.executar(id, clienteId, dto);
    return EnderecoResponseDto.fromDomain(endereco);
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('clienteId') clienteId: string, @Param('id') id: string): Promise<void> {
    await this.excluirEnderecoUseCase.executar(id, clienteId);
  }

  @Put(':id/padrao')
  async definirPadrao(
    @Param('clienteId') clienteId: string,
    @Param('id') id: string,
  ): Promise<EnderecoResponseDto> {
    const endereco = await this.definirEnderecoPadraoUseCase.executar(id, clienteId);
    return EnderecoResponseDto.fromDomain(endereco);
  }
}
