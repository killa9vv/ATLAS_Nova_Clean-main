import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SolicitarCriacaoContaUseCase } from '../application/auth/solicitar-criacao-conta.use-case';
import { LoginClienteUseCase } from '../application/auth/login-cliente.use-case';
import { RenovarTokenUseCase } from '../application/auth/renovar-token.use-case';
import { SolicitarRecuperacaoSenhaUseCase } from '../application/auth/solicitar-recuperacao-senha.use-case';
import { RedefinirSenhaUseCase } from '../application/auth/redefinir-senha.use-case';
import { ConfirmarTrocaEmailUseCase } from '../application/auth/confirmar-troca-email.use-case';
import { RegistrarClienteDto } from './dto/registrar-cliente.dto';
import { LoginClienteDto } from './dto/login-cliente.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { ConfirmarTrocaEmailDto } from './dto/confirmar-troca-email.dto';
import { LoginClienteResponseDto, RenovarTokenResponseDto } from './dto/login-cliente-response.dto';

// Entrypoints de autenticação do Cliente — mesmo prefixo /auth do login de
// staff/admin (auth/infrastructure/auth.controller.ts), separado por sub-rota
// porque são entidades e repositórios completamente diferentes (Cliente x Usuario).
@ApiTags('auth')
@Controller('auth/clientes')
export class ClientesAuthController {
  constructor(
    private readonly solicitarCriacaoContaUseCase: SolicitarCriacaoContaUseCase,
    private readonly loginClienteUseCase: LoginClienteUseCase,
    private readonly renovarTokenUseCase: RenovarTokenUseCase,
    private readonly solicitarRecuperacaoSenhaUseCase: SolicitarRecuperacaoSenhaUseCase,
    private readonly redefinirSenhaUseCase: RedefinirSenhaUseCase,
    private readonly confirmarTrocaEmailUseCase: ConfirmarTrocaEmailUseCase,
  ) {}

  // "Registrar" não define senha: manda um link de ativação pro e-mail (ver
  // SolicitarCriacaoContaUseCase) — a conta só passa a ter login depois que o dono
  // do e-mail escolhe a senha pelo link. Limite apertado porque cada chamada
  // dispara um e-mail.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('registrar')
  async registrar(@Body() dto: RegistrarClienteDto): Promise<{ mensagem: string }> {
    await this.solicitarCriacaoContaUseCase.executar(dto);
    return {
      mensagem: 'Enviamos um link pro seu e-mail pra ativar a conta e escolher sua senha.',
    };
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
  // do login: alvo de enumeração/abuso. O token vai só por e-mail agora — nunca
  // no corpo da resposta HTTP (antes ia aqui como workaround enquanto não havia
  // provedor de e-mail configurado).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('esqueci-senha')
  async esqueciSenha(@Body() dto: EsqueciSenhaDto): Promise<{ mensagem: string }> {
    await this.solicitarRecuperacaoSenhaUseCase.executar(dto.email);
    return {
      mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções de recuperação.',
    };
  }

  @HttpCode(204)
  @Post('redefinir-senha')
  async redefinirSenha(@Body() dto: RedefinirSenhaDto): Promise<void> {
    await this.redefinirSenhaUseCase.executar(dto.token, dto.novaSenha);
  }

  // Sem login de propósito: o link pode ser aberto em outro aparelho. Quem prova o
  // direito à troca é o token, que só chega a quem tem acesso ao e-mail novo.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(204)
  @Post('confirmar-troca-email')
  async confirmarTrocaEmail(@Body() dto: ConfirmarTrocaEmailDto): Promise<void> {
    await this.confirmarTrocaEmailUseCase.executar(dto.token);
  }
}
