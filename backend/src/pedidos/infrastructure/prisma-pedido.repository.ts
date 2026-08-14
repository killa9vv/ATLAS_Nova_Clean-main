// Implementação Prisma da porta PedidoRepository.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ItemPedidoEntity, NovoItemPedido, Pedido } from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { StatusPedido } from '../domain/status-pedido.enum';
import type { Pedido as PedidoPrisma, ItemPedido as ItemPedidoPrisma, StatusPedido as StatusPedidoPrisma } from '@prisma/client';

type PedidoComItens = PedidoPrisma & { itens: ItemPedidoPrisma[] };

@Injectable()
export class PrismaPedidoRepository extends PedidoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async criar(itens: NovoItemPedido[], total: number): Promise<Pedido> {
    const pedido = await this.prisma.pedido.create({
      data: {
        total,
        itens: {
          create: itens.map((item) => ({
            produtoId: item.produtoId,
            nome: item.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
          })),
        },
      },
      include: { itens: true },
    });

    return this.paraDominio(pedido);
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findUnique({ where: { id }, include: { itens: true } });
    if (!pedido) return null;
    return this.paraDominio(pedido);
  }

  async atualizarStatus(id: string, status: StatusPedido): Promise<Pedido> {
    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: { status: status as unknown as StatusPedidoPrisma },
      include: { itens: true },
    });
    return this.paraDominio(pedido);
  }

  private paraDominio(pedido: PedidoComItens): Pedido {
    const itens = pedido.itens.map(
      (item) => new ItemPedidoEntity(item.produtoId, item.nome, item.quantidade, Number(item.precoUnitario)),
    );

    return new Pedido(
      pedido.id,
      pedido.status as unknown as StatusPedido,
      itens,
      Number(pedido.total),
      pedido.createdAt,
      pedido.updatedAt,
    );
  }
}
