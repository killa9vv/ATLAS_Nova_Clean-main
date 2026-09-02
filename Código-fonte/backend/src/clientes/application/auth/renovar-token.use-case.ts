import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClienteRepository } from '../../domain/cliente.repository';
import { RefreshTokenRepository } from '../../domain/refresh-token.repository';
import { CredenciaisInvalidasException } from '../../domain/clientes.exceptions';
import { gerarTokenOpaco, hashToken } from '../../../shared/token.util';

const EXPIRACAO_REFRESH_DIAS = 30;

@Injectable()
export class RenovarTokenUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async executar(refreshTokenRecebido: string) {
    const token = await this.refreshTokenRepository.buscarPorHash(hashToken(refreshTokenRecebido));

    // Mesmo erro genérico pra token inexistente, expirado ou já revogado — não
    // distingue o motivo (evita dar pista útil pra quem está tentando adivinhar).
    if (!token || !token.estaValido()) {
      throw new CredenciaisInvalidasException();
    }

    const cliente = await this.clienteRepository.buscarPorId(token.clienteId);
    if (!cliente) {
      throw new CredenciaisInvalidasException();
    }

    // Rotação: revoga o token usado e emite um novo — reduz a janela de reuso se o
    // valor antigo vazar (replay só funciona uma vez).
    await this.refreshTokenRepository.revogar(token.id);

    const accessToken = await this.jwtService.signAsync(
      { sub: cliente.id, email: cliente.email, papel: 'CLIENTE' },
      { expiresIn: '1h' },
    );

    const { valor: novoRefreshToken, hash } = gerarTokenOpaco();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + EXPIRACAO_REFRESH_DIAS);
    await this.refreshTokenRepository.criar({ clienteId: cliente.id, tokenHash: hash, expiraEm });

    return { accessToken, refreshToken: novoRefreshToken };
  }
}
