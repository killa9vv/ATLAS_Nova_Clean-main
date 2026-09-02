import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CriarClienteUseCase } from '../application/criar-cliente.use-case';
import { AtualizarClienteUseCase } from '../application/atualizar-cliente.use-case';
import { BuscarClientePorIdUseCase } from '../application/buscar-cliente-por-id.use-case';
import { ListarClientesUseCase } from '../application/listar-clientes.use-case';
import { BuscarEnderecoPorCepUseCase } from '../application/buscar-endereco-por-cep.use-case';
import { TrocarSenhaUseCase } from '../application/auth/trocar-senha.use-case';
import { CriarClienteDto } from './dto/criar-cliente.dto';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { EnderecoPorCepResponseDto } from './dto/endereco-por-cep-response.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/infrastructure/decorators/roles.decorator';
import { ClienteAtual } from '../../auth/infrastructure/decorators/cliente-atual.decorator';
import { PapelUsuario } from '../../auth/domain/papel-usuario.enum';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(
    private readonly criarClienteUseCase: CriarClienteUseCase,
    private readonly atualizarClienteUseCase: AtualizarClienteUseCase,
    private readonly buscarClientePorIdUseCase: BuscarClientePorIdUseCase,
    private readonly listarClientesUseCase: ListarClientesUseCase,
    private readonly buscarEnderecoPorCepUseCase: BuscarEnderecoPorCepUseCase,
    private readonly trocarSenhaUseCase: TrocarSenhaUseCase,
  ) {}

  // "me" — dados do próprio cliente autenticado, id vem do JWT (ClienteAtual), nunca
  // de um :id de URL. Rotas estáticas ("me") antes da dinâmica (":id") abaixo, mesmo
  // motivo de "cep/:cep" acima não colidir.
  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.CLIENTE)
  async meuPerfil(@ClienteAtual() clienteId: string): Promise<ClienteResponseDto> {
    const cliente = await this.buscarClientePorIdUseCase.executar(clienteId);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Patch('me')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.CLIENTE)
  async atualizarMeuPerfil(
    @ClienteAtual() clienteId: string,
    @Body() dto: AtualizarClienteDto,
  ): Promise<ClienteResponseDto> {
    const cliente = await this.atualizarClienteUseCase.executar(clienteId, dto);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @HttpCode(204)
  @Patch('me/senha')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.CLIENTE)
  async trocarMinhaSenha(
    @ClienteAtual() clienteId: string,
    @Body() dto: TrocarSenhaDto,
  ): Promise<void> {
    await this.trocarSenhaUseCase.executar(clienteId, dto.senhaAtual, dto.novaSenha);
  }

  // Autocomplete de CEP pro formulário de endereço — não depende de cliente já
  // existir (usado durante o próprio cadastro). Rota estática ("cep/:cep") não
  // colide com a dinâmica de um segmento só (":id") abaixo.
  @Get('cep/:cep')
  async buscarPorCep(@Param('cep') cep: string): Promise<EnderecoPorCepResponseDto> {
    const endereco = await this.buscarEnderecoPorCepUseCase.executar(cep);
    return EnderecoPorCepResponseDto.fromDomain(endereco);
  }

  // Público de propósito, no mesmo espírito do checkout de convidado em pedidos:
  // não existe login de cliente hoje (só staff via Usuario/ADMIN — ver auth/).
  // O id (UUID v4) devolvido aqui funciona como o "segredo" que o front guarda
  // (localStorage, mesma lógica do sessionToken do Carrinho) pra provar dono do
  // perfil nas chamadas seguintes. Antes de um sistema de login de cliente existir,
  // essa é a mesma lacuna já aceita e documentada em GET /pedidos/:id/status.
  @Post()
  async criar(@Body() dto: CriarClienteDto): Promise<ClienteResponseDto> {
    const cliente = await this.criarClienteUseCase.executar(dto);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Get(':id')
  async buscarPorId(@Param('id') id: string): Promise<ClienteResponseDto> {
    const cliente = await this.buscarClientePorIdUseCase.executar(id);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Put(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() dto: AtualizarClienteDto,
  ): Promise<ClienteResponseDto> {
    const cliente = await this.atualizarClienteUseCase.executar(id, dto);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async listar(): Promise<ClienteResponseDto[]> {
    const clientes = await this.listarClientesUseCase.executar();
    return clientes.map(ClienteResponseDto.fromDomain);
  }
}
