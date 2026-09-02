import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RefreshToken } from '../domain/refresh-token.entity';
import {
  DadosCriacaoRefreshToken,
  RefreshTokenRepository,
} from '../domain/refresh-token.repository';
import type { RefreshToken as RefreshTokenPrisma } from '@prisma/client';

@Injectable()
export class PrismaRefreshTokenRepository extends RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async criar(dados: DadosCriacaoRefreshToken): Promise<RefreshToken> {
    const token = await this.prisma.refreshToken.create({
      data: {
        clienteId: dados.clienteId,
        tokenHash: dados.tokenHash,
        expiraEm: dados.expiraEm,
      },
    });
    return this.paraDominio(token);
  }

  async buscarPorHash(tokenHash: string): Promise<RefreshToken | null> {
    const token = await this.prisma.refreshToken.findFirst({ where: { tokenHash } });
    return token ? this.paraDominio(token) : null;
  }

  async revogar(id: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id }, data: { revogadoEm: new Date() } });
  }

  async revogarTodosDoCliente(clienteId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { clienteId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
  }

  private paraDominio(token: RefreshTokenPrisma): RefreshToken {
    return new RefreshToken(
      token.id,
      token.clienteId,
      token.tokenHash,
      token.expiraEm,
      token.createdAt,
      token.revogadoEm ?? undefined,
    );
  }
}
