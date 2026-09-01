import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Resenha } from '../domain/resenha.entity';
import { DadosCriacaoResenha, ResenhaRepository } from '../domain/resenha.repository';
import type { Resenha as ResenhaPrisma } from '@prisma/client';

@Injectable()
export class PrismaResenhaRepository extends ResenhaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodas(): Promise<Resenha[]> {
    const resenhas = await this.prisma.resenha.findMany({ orderBy: { createdAt: 'desc' } });
    return resenhas.map((resenha) => this.paraDominio(resenha));
  }

  async criar(dados: DadosCriacaoResenha): Promise<Resenha> {
    const resenha = await this.prisma.resenha.create({
      data: { nome: dados.nome, nota: dados.nota, comentario: dados.comentario },
    });
    return this.paraDominio(resenha);
  }

  private paraDominio(resenha: ResenhaPrisma): Resenha {
    return new Resenha(
      resenha.id,
      resenha.nome,
      resenha.nota,
      resenha.comentario,
      resenha.createdAt,
    );
  }
}
