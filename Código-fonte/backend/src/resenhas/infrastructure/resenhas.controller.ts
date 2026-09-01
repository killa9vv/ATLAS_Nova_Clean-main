import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListarResenhasUseCase } from '../application/listar-resenhas.use-case';
import { CriarResenhaUseCase } from '../application/criar-resenha.use-case';
import { CriarResenhaDto } from './dto/criar-resenha.dto';
import { ResenhaResponseDto } from './dto/resenha-response.dto';

// Inteiramente público: avaliação da loja, sem login de cliente — mesma lógica de
// checkout de convidado já usada em Pedido/Cliente. Sem moderação/exclusão hoje;
// fica pra quando existir um painel de moderação de verdade.
@ApiTags('resenhas')
@Controller('resenhas')
export class ResenhasController {
  constructor(
    private readonly listarResenhasUseCase: ListarResenhasUseCase,
    private readonly criarResenhaUseCase: CriarResenhaUseCase,
  ) {}

  @Get()
  async listar(): Promise<ResenhaResponseDto[]> {
    const resenhas = await this.listarResenhasUseCase.executar();
    return resenhas.map(ResenhaResponseDto.fromDomain);
  }

  @Post()
  async criar(@Body() dto: CriarResenhaDto): Promise<ResenhaResponseDto> {
    const resenha = await this.criarResenhaUseCase.executar(dto);
    return ResenhaResponseDto.fromDomain(resenha);
  }
}
