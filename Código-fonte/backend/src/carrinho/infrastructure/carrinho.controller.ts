import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MontarCarrinhoUseCase } from '../application/montar-carrinho.use-case';
import { VisualizarCarrinhoUseCase } from '../application/visualizar-carrinho.use-case';
import { AdicionarItemCarrinhoUseCase } from '../application/adicionar-item-carrinho.use-case';
import { AtualizarQuantidadeItemCarrinhoUseCase } from '../application/atualizar-quantidade-item-carrinho.use-case';
import { RemoverItemCarrinhoUseCase } from '../application/remover-item-carrinho.use-case';
import { LimparCarrinhoUseCase } from '../application/limpar-carrinho.use-case';
import { CalcularCarrinhoDto } from './dto/calcular-carrinho.dto';
import { CarrinhoResponseDto } from './dto/carrinho-response.dto';
import { AdicionarItemCarrinhoDto } from './dto/adicionar-item-carrinho.dto';
import { AtualizarQuantidadeItemDto } from './dto/atualizar-quantidade-item.dto';
import { CarrinhoSessaoResponseDto } from './dto/carrinho-sessao-response.dto';
import { OptionalJwtAuthGuard } from '../../auth/infrastructure/guards/optional-jwt-auth.guard';
import { SessaoCarrinhoInterceptor } from './interceptors/sessao-carrinho.interceptor';
import { SessaoCarrinhoToken } from './decorators/sessao-carrinho-token.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

interface RequisicaoComClienteOpcional {
  user?: { id: string; papel: string };
}

@ApiTags('carrinho')
@Controller('carrinho')
export class CarrinhoController {
  constructor(
    private readonly montarCarrinhoUseCase: MontarCarrinhoUseCase,
    private readonly visualizarCarrinhoUseCase: VisualizarCarrinhoUseCase,
    private readonly adicionarItemCarrinhoUseCase: AdicionarItemCarrinhoUseCase,
    private readonly atualizarQuantidadeItemCarrinhoUseCase: AtualizarQuantidadeItemCarrinhoUseCase,
    private readonly removerItemCarrinhoUseCase: RemoverItemCarrinhoUseCase,
    private readonly limparCarrinhoUseCase: LimparCarrinhoUseCase,
  ) {}

  // Endpoint público original: revalida/precifica uma lista de itens enviada no
  // body, sem depender de carrinho persistido — usado internamente por
  // CriarPedidoUseCase e ainda pode ser consumido diretamente. Sem guard de sessão
  // de propósito, continua alheio a sessionToken/cliente.
  @Post('calcular')
  async calcular(@Body() dto: CalcularCarrinhoDto): Promise<CarrinhoResponseDto> {
    const carrinho = await this.montarCarrinhoUseCase.executar(dto.itens);
    return CarrinhoResponseDto.fromDomain(carrinho);
  }

  private clienteIdDaRequisicao(request: RequisicaoComClienteOpcional): string | undefined {
    return request.user?.papel === PapelUsuario.CLIENTE ? request.user.id : undefined;
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(SessaoCarrinhoInterceptor)
  async visualizar(
    @SessaoCarrinhoToken() sessionToken: string | undefined,
    @Req() request: RequisicaoComClienteOpcional,
  ): Promise<CarrinhoSessaoResponseDto> {
    const resultado = await this.visualizarCarrinhoUseCase.executar(
      sessionToken,
      this.clienteIdDaRequisicao(request),
    );
    return CarrinhoSessaoResponseDto.fromResultado(resultado);
  }

  @Post('itens')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(SessaoCarrinhoInterceptor)
  async adicionar(
    @Body() dto: AdicionarItemCarrinhoDto,
    @SessaoCarrinhoToken() sessionToken: string | undefined,
    @Req() request: RequisicaoComClienteOpcional,
  ): Promise<CarrinhoSessaoResponseDto> {
    const clienteId = this.clienteIdDaRequisicao(request);
    const tokenResolvido = await this.adicionarItemCarrinhoUseCase.executar(
      sessionToken,
      clienteId,
      dto.produtoId,
      dto.quantidade,
    );
    const resultado = await this.visualizarCarrinhoUseCase.executar(tokenResolvido, clienteId);
    return CarrinhoSessaoResponseDto.fromResultado(resultado);
  }

  @Patch('itens/:produtoId')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(SessaoCarrinhoInterceptor)
  async atualizarQuantidade(
    @Param('produtoId') produtoId: string,
    @Body() dto: AtualizarQuantidadeItemDto,
    @SessaoCarrinhoToken() sessionToken: string | undefined,
    @Req() request: RequisicaoComClienteOpcional,
  ): Promise<CarrinhoSessaoResponseDto> {
    const clienteId = this.clienteIdDaRequisicao(request);
    const tokenResolvido = await this.atualizarQuantidadeItemCarrinhoUseCase.executar(
      sessionToken,
      clienteId,
      produtoId,
      dto.quantidade,
    );
    const resultado = await this.visualizarCarrinhoUseCase.executar(tokenResolvido, clienteId);
    return CarrinhoSessaoResponseDto.fromResultado(resultado);
  }

  @Delete('itens/:produtoId')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(SessaoCarrinhoInterceptor)
  async remover(
    @Param('produtoId') produtoId: string,
    @SessaoCarrinhoToken() sessionToken: string | undefined,
    @Req() request: RequisicaoComClienteOpcional,
  ): Promise<CarrinhoSessaoResponseDto> {
    const clienteId = this.clienteIdDaRequisicao(request);
    const tokenResolvido = await this.removerItemCarrinhoUseCase.executar(
      sessionToken,
      clienteId,
      produtoId,
    );
    const resultado = await this.visualizarCarrinhoUseCase.executar(tokenResolvido, clienteId);
    return CarrinhoSessaoResponseDto.fromResultado(resultado);
  }

  @Delete()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(SessaoCarrinhoInterceptor)
  async limpar(
    @SessaoCarrinhoToken() sessionToken: string | undefined,
    @Req() request: RequisicaoComClienteOpcional,
  ): Promise<CarrinhoSessaoResponseDto> {
    const clienteId = this.clienteIdDaRequisicao(request);
    const tokenResolvido = await this.limparCarrinhoUseCase.executar(sessionToken, clienteId);
    const resultado = await this.visualizarCarrinhoUseCase.executar(tokenResolvido, clienteId);
    return CarrinhoSessaoResponseDto.fromResultado(resultado);
  }
}
