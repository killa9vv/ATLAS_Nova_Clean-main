import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Cupom, TipoDesconto } from '../domain/cupom.entity';
import {
  CupomRepository,
  DadosAtualizacaoCupom,
  DadosCriacaoCupom,
} from '../domain/cupom.repository';
import type { Cupom as CupomPrisma, TipoDesconto as TipoDescontoPrisma } from '@prisma/client';

@Injectable()
export class PrismaCupomRepository extends CupomRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodos(): Promise<Cupom[]> {
    const cupons = await this.prisma.cupom.findMany({ orderBy: { createdAt: 'desc' } });
    return cupons.map((cupom) => this.paraDominio(cupom));
  }

  async buscarPorId(id: string): Promise<Cupom | null> {
    const cupom = await this.prisma.cupom.findUnique({ where: { id } });
    return cupom ? this.paraDominio(cupom) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Cupom | null> {
    const cupom = await this.prisma.cupom.findUnique({ where: { codigo } });
    return cupom ? this.paraDominio(cupom) : null;
  }

  async criar(dados: DadosCriacaoCupom): Promise<Cupom> {
    const cupom = await this.prisma.cupom.create({
      data: {
        codigo: dados.codigo,
        tipoDesconto: dados.tipoDesconto as unknown as TipoDescontoPrisma,
        valor: dados.valor,
        validoAte: dados.validoAte,
        usoMaximo: dados.usoMaximo,
      },
    });
    return this.paraDominio(cupom);
  }

  async atualizar(id: string, dados: DadosAtualizacaoCupom): Promise<Cupom> {
    const cupom = await this.prisma.cupom.update({
      where: { id },
      data: {
        tipoDesconto: dados.tipoDesconto as unknown as TipoDescontoPrisma | undefined,
        valor: dados.valor,
        ativo: dados.ativo,
        validoAte: dados.validoAte,
        usoMaximo: dados.usoMaximo,
      },
    });
    return this.paraDominio(cupom);
  }

  private paraDominio(cupom: CupomPrisma): Cupom {
    return new Cupom(
      cupom.id,
      cupom.codigo,
      cupom.tipoDesconto as unknown as TipoDesconto,
      Number(cupom.valor),
      cupom.ativo,
      cupom.usosCount,
      cupom.createdAt,
      cupom.validoAte ?? undefined,
      cupom.usoMaximo ?? undefined,
    );
  }
}
