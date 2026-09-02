import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CriarClienteUseCase } from '../application/criar-cliente.use-case';
import { LoginClienteUseCase } from '../application/auth/login-cliente.use-case';
import { RenovarTokenUseCase } from '../application/auth/renovar-token.use-case';
import { SolicitarRecuperacaoSenhaUseCase } from '../application/auth/solicitar-recuperacao-senha.use-case';
import { RedefinirSenhaUseCase } from '../application/auth/redefinir-senha.use-case';
import { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import { LoginClienteDto } from './dto/login-cliente.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { ClienteResponseDto } from './dto/cliente-response.dto';
import { LoginClienteResponseDto, RenovarTokenResponseDto } from './dto/login-cliente-response.dto';

// Entrypoints de autenticação do Cliente — mesmo prefixo /auth do login de
// staff/admin (auth/infrastructure/auth.controller.ts), separado por sub-rota
// porque são entidades e repositórios completamente diferentes (Cliente x Usuario).
@ApiTags('auth')
@Controller('auth/clientes')
export class ClientesAuthController {
  constructor(
    private readonly criarClienteUseCase: CriarClienteUseCase,
    private readonly loginClienteUseCase: LoginClienteUseCase,
    private readonly renovarTokenUseCase: RenovarTokenUseCase,
    private readonly solicitarRecuperacaoSenhaUseCase: SolicitarRecuperacaoSenhaUseCase,
    private readonly redefinirSenhaUseCase: RedefinirSenhaUseCase,
  ) {}

  // "Registrar" reaproveita CriarClienteUseCase (upsert por e-mail) — cobre tanto
  // criar um Cliente novo já com senha quanto transformar em conta um Cliente que
  // já existia só do checkout de convidado.
  @Post('registrar')
  async registrar(@Body() dto: RegistrarClienteDto): Promise<ClienteResponseDto> {
    const cliente = await this.criarClienteUseCase.executar(dto);
    return ClienteResponseDto.fromDomain(cliente);
  }

  // Limite apertado igual ao login de admin: alvo natural de força bruta.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginClienteDto): Promise<LoginClienteResponseDto> {
    return this.loginClienteUseCase.executar(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto): Promise<RenovarTokenResponseDto> {
    return this.renovarTokenUseCase.executar(dto.refreshToken);
  }

  // Sempre 200 independente do e-mail existir ou não — não confirma nem nega
  // cadastro (ver SolicitarRecuperacaoSenhaUseCase). Throttled pelo mesmo motivo
  // do login: alvo de enumeração/abuso.
  //
  // `token` só vem preenchido no corpo da resposta enquanto não existir envio de
  // e-mail de verdade (ver TODO em SolicitarRecuperacaoSenhaUseCase) — é assim que
  // o cliente descobre o token pra chamar POST /redefinir-senha hoje. Quando um
  // provedor de e-mail for configurado, isso deve parar de ir na resposta HTTP
  // (só no e-mail) — undefined vira o valor sempre devolvido.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('esqueci-senha')
  async esqueciSenha(@Body() dto: EsqueciSenhaDto): Promise<{ mensagem: string; token?: string }> {
    const token = await this.solicitarRecuperacaoSenhaUseCase.executar(dto.email);
    return {
      mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.',
      token: token ?? undefined,
    };
  }

  @HttpCode(204)
  @Post('redefinir-senha')
  async redefinirSenha(@Body() dto: RedefinirSenhaDto): Promise<void> {
    await this.redefinirSenhaUseCase.executar(dto.token, dto.novaSenha);
  }
}
