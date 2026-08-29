import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  DadosEntregaPedido,
  ItemPedidoEntity,
  NovoItemPedido,
  Pedido,
  TipoEntrega,
} from '../domain/pedido.entity';
import { PedidoRepository } from '../domain/pedido.repository';
import { StatusPedido } from '../domain/status-pedido.enum';
import type {
  Pedido as PedidoPrisma,
  ItemPedido as ItemPedidoPrisma,
  StatusPedido as StatusPedidoPrisma,
  TipoEntrega as TipoEntregaPrisma,
  Prisma,
} from '@prisma/client';

type PedidoComItens = PedidoPrisma & { itens: ItemPedidoPrisma[] };
/** Cliente Prisma "normal" ou um client de transação (`tx` de `$transaction`) — mesma API pro que é usado aqui. */
type ClientePrisma = PrismaService | Prisma.TransactionClient;

@Injectable()
export class PrismaPedidoRepository extends PedidoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async criar(
    itens: NovoItemPedido[],
    total: number,
    entrega: DadosEntregaPedido,
    statusInicial?: StatusPedido,
    contexto?: unknown,
  ): Promise<Pedido> {
    const cliente = (contexto as ClientePrisma | undefined) ?? this.prisma;
    const pedido = await cliente.pedido.create({
      data: {
        total,
        status: statusInicial as unknown as StatusPedidoPrisma | undefined,
        tipoEntrega: entrega.tipoEntrega as unknown as TipoEntregaPrisma,
        valorFrete: entrega.valorFrete,
        enderecoCep: entrega.endereco?.cep,
        enderecoLogradouro: entrega.endereco?.logradouro,
        enderecoNumero: entrega.endereco?.numero,
        enderecoComplemento: entrega.endereco?.complemento,
        enderecoBairro: entrega.endereco?.bairro,
        enderecoCidade: entrega.endereco?.cidade,
        enderecoEstado: entrega.endereco?.estado,
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

  async atualizarStatus(id: string, status: StatusPedido, contexto?: unknown): Promise<Pedido> {
    const cliente = (contexto as ClientePrisma | undefined) ?? this.prisma;
    const pedido = await cliente.pedido.update({
      where: { id },
      data: { status: status as unknown as StatusPedidoPrisma },
      include: { itens: true },
    });
    return this.paraDominio(pedido);
  }

  private paraDominio(pedido: PedidoComItens): Pedido {
    const itens = pedido.itens.map(
      (item) =>
        new ItemPedidoEntity(
          item.produtoId,
          item.nome,
          item.quantidade,
          Number(item.precoUnitario),
        ),
    );

    const endereco = pedido.enderecoCep
      ? {
          cep: pedido.enderecoCep,
          logradouro: pedido.enderecoLogradouro!,
          numero: pedido.enderecoNumero!,
          bairro: pedido.enderecoBairro!,
          cidade: pedido.enderecoCidade!,
          estado: pedido.enderecoEstado!,
          complemento: pedido.enderecoComplemento ?? undefined,
        }
      : undefined;

    return new Pedido(
      pedido.id,
      pedido.status as unknown as StatusPedido,
      itens,
      Number(pedido.total),
      pedido.tipoEntrega as unknown as TipoEntrega,
      Number(pedido.valorFrete),
      pedido.createdAt,
      pedido.updatedAt,
      endereco,
    );
  }
}
