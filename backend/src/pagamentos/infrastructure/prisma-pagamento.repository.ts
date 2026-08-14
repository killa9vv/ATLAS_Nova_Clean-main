// Implementação Prisma da porta PagamentoRepository.
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
    status: StatusPagamento,
    gatewayPayload: unknown,
  ): Promise<Pagamento> {
    const pagamento = await this.prisma.pagamento.update({
      where: { id },
      data: {
        status: status as unknown as StatusPagamentoPrisma,
        gatewayPayload: (gatewayPayload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    return this.paraDominio(pagamento);
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
