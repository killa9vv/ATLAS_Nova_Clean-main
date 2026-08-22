import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Pagamento as PagamentoPrisma,
  MetodoPagamento as MetodoPagamentoPrisma,
  StatusPagamento as StatusPagamentoPrisma,
} from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MetodoPagamento } from '../domain/metodo-pagamento.enum';
import { Pagamento } from '../domain/pagamento.entity';
import { NovoPagamento, PagamentoRepository } from '../domain/pagamento.repository';
import { StatusPagamento } from '../domain/status-pagamento.enum';

@Injectable()
export class PrismaPagamentoRepository extends PagamentoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async criar(dados: NovoPagamento): Promise<Pagamento> {
    const pagamento = await this.prisma.pagamento.create({
      data: {
        pedidoId: dados.pedidoId,
        metodo: dados.metodo as unknown as MetodoPagamentoPrisma,
        status: dados.status as unknown as StatusPagamentoPrisma,
        valor: dados.valor,
        gatewayTransactionId: dados.gatewayTransactionId,
        gatewayPayload: (dados.gatewayPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    return this.paraDominio(pagamento);
  }

  async buscarPorId(id: string): Promise<Pagamento | null> {
    const pagamento = await this.prisma.pagamento.findUnique({ where: { id } });
    return pagamento ? this.paraDominio(pagamento) : null;
  }

  async buscarPorGatewayTransactionId(gatewayTransactionId: string): Promise<Pagamento | null> {
    const pagamento = await this.prisma.pagamento.findUnique({ where: { gatewayTransactionId } });
    return pagamento ? this.paraDominio(pagamento) : null;
  }

  async atualizarStatus(
    id: string,
    statusEsperado: StatusPagamento,
    novoStatus: StatusPagamento,
    gatewayPayload: unknown,
  ): Promise<Pagamento | null> {
    // updateMany (em vez de update) porque a condição extra no WHERE (status atual)
    // não é uma chave única — se o status já mudou, count fica 0 em vez de lançar.
    const resultado = await this.prisma.pagamento.updateMany({
      where: { id, status: statusEsperado as unknown as StatusPagamentoPrisma },
      data: {
        status: novoStatus as unknown as StatusPagamentoPrisma,
        gatewayPayload: (gatewayPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });

    if (resultado.count === 0) {
      return null;
    }

    const pagamento = await this.prisma.pagamento.findUniqueOrThrow({ where: { id } });
    return this.paraDominio(pagamento);
  }

  async listarPendentesCriadosAntesDe(limite: Date): Promise<Pagamento[]> {
    const pagamentos = await this.prisma.pagamento.findMany({
      where: {
        status: {
          in: [
            StatusPagamento.PENDENTE,
            StatusPagamento.EM_PROCESSAMENTO,
          ] as unknown as StatusPagamentoPrisma[],
        },
        createdAt: { lt: limite },
        gatewayTransactionId: { not: null },
      },
    });
    return pagamentos.map((pagamento) => this.paraDominio(pagamento));
  }

  private paraDominio(pagamento: PagamentoPrisma): Pagamento {
    return new Pagamento(
      pagamento.id,
      pagamento.pedidoId,
      pagamento.metodo as unknown as MetodoPagamento,
      pagamento.status as unknown as StatusPagamento,
      Number(pagamento.valor),
      pagamento.gatewayTransactionId,
      pagamento.createdAt,
      pagamento.updatedAt,
    );
  }
}
