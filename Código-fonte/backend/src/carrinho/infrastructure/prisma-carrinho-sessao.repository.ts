import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CarrinhoSessaoRepository } from '../domain/carrinho-sessao.repository';
import { CarrinhoSessao, ItemCarrinhoSessao } from '../domain/carrinho-sessao';
import type {
  Carrinho as CarrinhoPrisma,
  ItemCarrinho as ItemCarrinhoPrisma,
} from '@prisma/client';

type CarrinhoComItens = CarrinhoPrisma & { itens: ItemCarrinhoPrisma[] };

@Injectable()
export class PrismaCarrinhoSessaoRepository extends CarrinhoSessaoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async buscarPorSessionToken(sessionToken: string): Promise<CarrinhoSessao | null> {
    const carrinho = await this.prisma.carrinho.findUnique({
      where: { sessionToken },
      include: { itens: true },
    });
    return carrinho ? this.paraDominio(carrinho) : null;
  }

  async buscarPorClienteId(clienteId: string): Promise<CarrinhoSessao | null> {
    const carrinho = await this.prisma.carrinho.findFirst({
      where: { clienteId },
      include: { itens: true },
    });
    return carrinho ? this.paraDominio(carrinho) : null;
  }

  async criar(
    sessionToken: string,
    clienteId: string | undefined,
    expiraEm: Date,
  ): Promise<CarrinhoSessao> {
    const carrinho = await this.prisma.carrinho.create({
      data: { sessionToken, clienteId, expiraEm },
      include: { itens: true },
    });
    return this.paraDominio(carrinho);
  }

  async adotarPorCliente(carrinhoId: string, clienteId: string): Promise<void> {
    await this.prisma.carrinho.update({ where: { id: carrinhoId }, data: { clienteId } });
  }

  async upsertItem(
    carrinhoId: string,
    produtoId: string,
    quantidade: number,
    expiraEm: Date,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.itemCarrinho.upsert({
        where: { carrinhoId_produtoId: { carrinhoId, produtoId } },
        create: { carrinhoId, produtoId, quantidade },
        update: { quantidade: { increment: quantidade } },
      }),
      this.prisma.carrinho.update({ where: { id: carrinhoId }, data: { expiraEm } }),
    ]);
  }

  async definirQuantidadeItem(
    carrinhoId: string,
    produtoId: string,
    quantidade: number,
    expiraEm: Date,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.itemCarrinho.upsert({
        where: { carrinhoId_produtoId: { carrinhoId, produtoId } },
        create: { carrinhoId, produtoId, quantidade },
        update: { quantidade },
      }),
      this.prisma.carrinho.update({ where: { id: carrinhoId }, data: { expiraEm } }),
    ]);
  }

  async removerItem(carrinhoId: string, produtoId: string): Promise<void> {
    // deleteMany (não delete) porque não é garantido que a linha exista — remover um
    // item que já não está no carrinho é um no-op, não um erro.
    await this.prisma.itemCarrinho.deleteMany({ where: { carrinhoId, produtoId } });
  }

  async limpar(carrinhoId: string): Promise<void> {
    await this.prisma.itemCarrinho.deleteMany({ where: { carrinhoId } });
  }

  async deletarExpirados(antesDe: Date): Promise<number> {
    const expirados = await this.prisma.carrinho.findMany({
      where: { expiraEm: { lt: antesDe } },
      select: { id: true },
    });
    if (expirados.length === 0) return 0;

    const ids = expirados.map((carrinho) => carrinho.id);
    await this.prisma.$transaction([
      this.prisma.itemCarrinho.deleteMany({ where: { carrinhoId: { in: ids } } }),
      this.prisma.carrinho.deleteMany({ where: { id: { in: ids } } }),
    ]);
    return ids.length;
  }

  private paraDominio(carrinho: CarrinhoComItens): CarrinhoSessao {
    return new CarrinhoSessao(
      carrinho.id,
      carrinho.sessionToken,
      carrinho.clienteId ?? undefined,
      carrinho.itens.map((item) => new ItemCarrinhoSessao(item.produtoId, item.quantidade)),
      carrinho.expiraEm ?? undefined,
    );
  }
}
