import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cliente } from '../../domain/cliente.entity';
import { TokenTrocaEmailInvalidoException } from '../../domain/clientes.exceptions';
import { hashToken } from '../../../shared/token.util';

export interface PayloadTrocaEmail {
  sub: string;
  emailAtual: string;
  novoEmail: string;
  /** Resumo do hash da senha: trocar a senha invalida os links de troca pendentes. */
  versaoSenha: string;
}

function normalizar(email?: string): string {
  return (email ?? '').toLowerCase();
}

function versaoSenha(cliente: Cliente): string {
  return hashToken(cliente.senhaHash ?? '').slice(0, 16);
}

/**
 * Link de troca de e-mail como token assinado, sem tabela: o novo e-mail precisa ficar
 * guardado em algum lugar até a confirmação, e aqui ele viaja no próprio link. Vale uma
 * vez só porque carrega o e-mail atual — depois de usado, ele não bate mais.
 *
 * Segredo derivado, não o JWT_SECRET puro: este token não pode servir como access token
 * (o JwtStrategy o rejeita), nem um access token servir aqui.
 */
@Injectable()
export class TokenTrocaEmailService {
  private readonly segredo: string;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.segredo = `${configService.get<string>('JWT_SECRET')}:troca-email`;
  }

  gerar(cliente: Cliente, novoEmail: string): Promise<string> {
    const payload: PayloadTrocaEmail = {
      sub: cliente.id,
      emailAtual: normalizar(cliente.email),
      novoEmail,
      versaoSenha: versaoSenha(cliente),
    };
    return this.jwtService.signAsync(payload, { secret: this.segredo, expiresIn: '24h' });
  }

  /** Só confere assinatura e validade — o estado da conta fica com `garantirVigente`. */
  async ler(token: string): Promise<PayloadTrocaEmail> {
    try {
      return await this.jwtService.verifyAsync<PayloadTrocaEmail>(token, { secret: this.segredo });
    } catch {
      throw new TokenTrocaEmailInvalidoException();
    }
  }

  /** O token só vale enquanto e-mail e senha da conta forem os da hora em que foi emitido. */
  garantirVigente(payload: PayloadTrocaEmail, cliente: Cliente | null): asserts cliente is Cliente {
    if (
      !cliente ||
      normalizar(cliente.email) !== payload.emailAtual ||
      versaoSenha(cliente) !== payload.versaoSenha
    ) {
      throw new TokenTrocaEmailInvalidoException();
    }
  }
}
