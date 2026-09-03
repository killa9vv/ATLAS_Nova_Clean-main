import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ClienteRepository } from '../../domain/cliente.repository';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { CredenciaisInvalidasException } from '../../domain/clientes.exceptions';
import { gerarTokenOpaco } from '../../../shared/token.util';

export interface LoginClienteInput {
  email: string;
  senha: string;
}

export interface LoginClienteOutput {
  accessToken: string;
  refreshToken: string;
  cliente: { id: string; nome: string; email?: string };
}

const EXPIRACAO_REFRESH_DIAS = 30;

@Injectable()
export class LoginClienteUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async executar(input: LoginClienteInput): Promise<LoginClienteOutput> {
    const cliente = await this.clienteRepository.buscarPorEmail(input.email);

    // Mesma mensagem genérica pros três casos (cliente não existe, sem senha
    // cadastrada, senha errada) — nunca revela qual deles é o motivo real.
    if (!cliente || !cliente.possuiSenha()) {
      throw new CredenciaisInvalidasException();
    }

    const senhaValida = await bcrypt.compare(input.senha, cliente.senhaHash as string);
    if (!senhaValida) {
      throw new CredenciaisInvalidasException();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: cliente.id, email: cliente.email, papel: 'CLIENTE' },
      { expiresIn: '1h' },
    );

    const { valor: refreshToken, hash } = gerarTokenOpaco();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + EXPIRACAO_REFRESH_DIAS);
    await this.refreshTokenRepository.criar({ clienteId: cliente.id, tokenHash: hash, expiraEm });

    return {
      accessToken,
      refreshToken,
      cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email },
    };
  }
}
