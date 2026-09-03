import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TokenRecuperacaoSenha } from '../domain/token-recuperacao-senha.entity';
import {
  DadosCriacaoTokenRecuperacao,
  TokenRecuperacaoSenhaRepository,
} from '../domain/token-recuperacao-senha.repository';
import type { TokenRecuperacaoSenha as TokenPrisma } from '@prisma/client';

@Injectable()
export class PrismaTokenRecuperacaoSenhaRepository extends TokenRecuperacaoSenhaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async criar(dados: DadosCriacaoTokenRecuperacao): Promise<TokenRecuperacaoSenha> {
    const token = await this.prisma.tokenRecuperacaoSenha.create({
      data: {
        clienteId: dados.clienteId,
        tokenHash: dados.tokenHash,
        expiraEm: dados.expiraEm,
      },
    });
    return this.paraDominio(token);
  }

  async buscarPorHash(tokenHash: string): Promise<TokenRecuperacaoSenha | null> {
    const token = await this.prisma.tokenRecuperacaoSenha.findFirst({ where: { tokenHash } });
    return token ? this.paraDominio(token) : null;
  }

  async marcarComoUsado(id: string): Promise<void> {
    await this.prisma.tokenRecuperacaoSenha.update({
      where: { id },
      data: { usadoEm: new Date() },
    });
  }

  async invalidarValidosDoCliente(clienteId: string): Promise<void> {
    await this.prisma.tokenRecuperacaoSenha.updateMany({
      where: { clienteId, usadoEm: null, expiraEm: { gt: new Date() } },
      data: { usadoEm: new Date() },
    });
  }

  private paraDominio(token: TokenPrisma): TokenRecuperacaoSenha {
    return new TokenRecuperacaoSenha(
      token.id,
      token.clienteId,
      token.tokenHash,
      token.expiraEm,
      token.createdAt,
      token.usadoEm ?? undefined,
    );
  }
}
