import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  ContatoPedido,
  DadosEntregaPedido,
  ItemPedidoEntity,
  NovoItemPedido,
  Pedido,
  TipoEntrega,
} from '../domain/pedido.entity';
import {
  FiltrosListagemPedidosCliente,
  PedidoRepository,
  ResultadoPaginadoPedidos,
} from '../domain/pedido.repository';
import { StatusPedido } from '../domain/status-pedido.enum';
import { HistoricoStatusPedido } from '../domain/historico-status-pedido.entity';
import type {
  Pedido as PedidoPrisma,
  ItemPedido as ItemPedidoPrisma,
  StatusPedido as StatusPedidoPrisma,
  TipoEntrega as TipoEntregaPrisma,
  PedidoStatusHistorico as HistoricoPrisma,
  Prisma,
} from '@prisma/client';

type PedidoComItens = PedidoPrisma & { itens: ItemPedidoPrisma[] };

/**
 * Cliente Prisma "normal" ou um client de transação (`tx` de `$transaction`)
 * — mesma API para o que é usado aqui.
 */
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
    contato: ContatoPedido,
    clienteId?: string,
    statusInicial?: StatusPedido,
    contexto?: unknown,
  ): Promise<Pedido> {
    const cliente = (contexto as ClientePrisma | undefined) ?? this.prisma;

    const pedido = await cliente.pedido.create({
      data: {
        total,
        status: statusInicial as unknown as StatusPedidoPrisma | undefined,
        clienteId,
        contatoNome: contato.nome,
        contatoEmail: contato.email,
        contatoTelefone: contato.telefone,
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
            freteRateado: item.freteRateado ?? 0,
          })),
        },
      },
      include: { itens: true },
    });

    return this.paraDominio(pedido);
  }

  async buscarPorId(id: string): Promise<Pedido | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!pedido) return null;

    return this.paraDominio(pedido);
  }

  async listarTodos(): Promise<Pedido[]> {
    const pedidos = await this.prisma.pedido.findMany({
      include: { itens: true },
      orderBy: { createdAt: 'desc' },
    });

    return pedidos.map((pedido) => this.paraDominio(pedido));
  }

  async listarPorCliente(
    clienteId: string,
    filtros: FiltrosListagemPedidosCliente,
  ): Promise<ResultadoPaginadoPedidos> {
    const where: Prisma.PedidoWhereInput = {
      clienteId,
      status: filtros.status as unknown as StatusPedidoPrisma | undefined,
    };

    const [pedidos, total] = await this.prisma.$transaction([
      this.prisma.pedido.findMany({
        where,
        include: { itens: true },
        orderBy: { createdAt: 'desc' },
        skip: (filtros.pagina - 1) * filtros.limite,
        take: filtros.limite,
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return {
      itens: pedidos.map((pedido) => this.paraDominio(pedido)),
      total,
      pagina: filtros.pagina,
      limite: filtros.limite,
    };
  }

  async listarHistoricoStatus(pedidoId: string): Promise<HistoricoStatusPedido[]> {
    const historico = await this.prisma.pedidoStatusHistorico.findMany({
      where: { pedidoId },
      orderBy: { alteradoEm: 'desc' },
    });
    return historico.map((item) => this.historicoParaDominio(item));
  }

  async atualizarStatus(id: string, status: StatusPedido, contexto?: unknown): Promise<Pedido> {
    const cliente = (contexto as ClientePrisma | undefined) ?? this.prisma;

    // Lê o status atual antes de sobrescrever — precisa dele pra registrar
    // statusAnterior no histórico (Prisma update() só devolve o estado novo).
    const atual = await cliente.pedido.findUniqueOrThrow({
      where: { id },
      select: { status: true },
    });

    const pedido = await cliente.pedido.update({
      where: { id },
      data: {
        status: status as unknown as StatusPedidoPrisma,
      },
      include: { itens: true },
    });

    await cliente.pedidoStatusHistorico.create({
      data: {
        pedidoId: id,
        statusAnterior: atual.status,
        statusNovo: status as unknown as StatusPedidoPrisma,
      },
    });

    return this.paraDominio(pedido);
  }

  async atualizarRastreio(id: string, codigoRastreio: string | null): Promise<Pedido> {
    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: { codigoRastreio },
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
          Number(item.freteRateado),
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

    // Fallback pra pedidos criados antes dessa coluna existir (contatoNome null) —
    // nunca deveria acontecer pra pedidos novos, o DTO de criação exige `nome`.
    const contato: ContatoPedido = {
      nome: pedido.contatoNome ?? '',
      email: pedido.contatoEmail ?? undefined,
      telefone: pedido.contatoTelefone ?? undefined,
    };

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
      pedido.codigoRastreio ?? undefined,
      contato,
      pedido.clienteId ?? undefined,
    );
  }

  private historicoParaDominio(historico: HistoricoPrisma): HistoricoStatusPedido {
    return new HistoricoStatusPedido(
      historico.id,
      historico.pedidoId,
      historico.statusNovo as unknown as StatusPedido,
      historico.alteradoEm,
      (historico.statusAnterior as unknown as StatusPedido) ?? undefined,
    );
  }
}
