// Implementação Prisma da porta ProdutoRepository.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Produto } from '../domain/produto.entity';
import { ProdutoRepository } from '../domain/produto.repository';
import type { Produto as ProdutoPrisma } from '@prisma/client';

@Injectable()
export class PrismaProdutoRepository extends ProdutoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodos(): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany();
    return produtos.map((produto) => this.paraDominio(produto));
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    return produto ? this.paraDominio(produto) : null;
  }

  async buscarPorIds(ids: string[]): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({ where: { id: { in: ids } } });
    return produtos.map((produto) => this.paraDominio(produto));
  }

  private paraDominio(produto: ProdutoPrisma): Produto {
    return new Produto(
      produto.id,
      produto.nome,
      Number(produto.preco),
      produto.estoque,
      produto.descricao ?? undefined,
    );
  }
}
