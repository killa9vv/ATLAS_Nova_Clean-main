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
import { Throttle } from '@nestjs/throttler';
import { CriarClienteUseCase } from '../application/criar-cliente.use-case';
import { AtualizarClienteUseCase } from '../application/atualizar-cliente.use-case';
import { BuscarClientePorIdUseCase } from '../application/buscar-cliente-por-id.use-case';
import { ListarClientesUseCase } from '../application/listar-clientes.use-case';
import { BuscarEnderecoPorCepUseCase } from '../application/buscar-endereco-por-cep.use-case';
import { TrocarSenhaUseCase } from '../application/auth/trocar-senha.use-case';
import { SolicitarTrocaEmailUseCase } from '../application/auth/solicitar-troca-email.use-case';
import { CriarClienteDto } from './dto/criar-cliente.dto';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';
import { TrocarSenhaDto } from './dto/trocar-senha.dto';
import { AtualizarMeuPerfilDto } from './dto/atualizar-meu-perfil.dto';
import { SolicitarTrocaEmailDto } from './dto/solicitar-troca-email.dto';
import { ClienteCriadoResponseDto, ClienteResponseDto } from './dto/cliente-response.dto';
import { EnderecoPorCepResponseDto } from './dto/endereco-por-cep-response.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { ClienteAtual } from '../../auth/presentation/decorators/cliente-atual.decorator';
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
    private readonly solicitarTrocaEmailUseCase: SolicitarTrocaEmailUseCase,
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
    @Body() dto: AtualizarMeuPerfilDto,
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

  // Limite baixo: a rota confere a senha, não pode virar tentativa e erro.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('me/email')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.CLIENTE)
  async solicitarTrocaEmail(
    @ClienteAtual() clienteId: string,
    @Body() dto: SolicitarTrocaEmailDto,
  ): Promise<{ mensagem: string }> {
    await this.solicitarTrocaEmailUseCase.executar(clienteId, dto.novoEmail, dto.senhaAtual);
    return {
      mensagem: `Enviamos um link de confirmação para ${dto.novoEmail}. Seu e-mail só muda depois que você clicar nele.`,
    };
  }

  // Autocomplete de CEP pro formulário de endereço — não depende de cliente já
  // existir (usado durante o próprio cadastro). Rota estática ("cep/:cep") não
  // colide com a dinâmica de um segmento só (":id") abaixo.
  @Get('cep/:cep')
  async buscarPorCep(@Param('cep') cep: string): Promise<EnderecoPorCepResponseDto> {
    const endereco = await this.buscarEnderecoPorCepUseCase.executar(cep);
    return EnderecoPorCepResponseDto.fromDomain(endereco);
  }

  // Público de propósito: checkout de convidado com "salvar meus dados". Como é
  // upsert por e-mail, qualquer um pode chamar com o e-mail de outra pessoa — por
  // isso devolve só o id (nunca nome/telefone/CPF), e GET/PUT /clientes/:id são só
  // de admin. O cliente logado vê/edita os próprios dados em /clientes/me.
  @Post()
  async criar(@Body() dto: CriarClienteDto): Promise<ClienteCriadoResponseDto> {
    const cliente = await this.criarClienteUseCase.executar(dto);
    return ClienteCriadoResponseDto.fromDomain(cliente);
  }

  // Eram públicas: com o id devolvido pelo POST acima, qualquer um lia e alterava o
  // cadastro de qualquer cliente. O site não usa estas rotas — só o painel admin.
  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  async buscarPorId(@Param('id') id: string): Promise<ClienteResponseDto> {
    const cliente = await this.buscarClientePorIdUseCase.executar(id);
    return ClienteResponseDto.fromDomain(cliente);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
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
