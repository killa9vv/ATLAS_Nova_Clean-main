import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Produto } from '../domain/produto.entity';
import {
  DadosAtualizacaoProduto,
  DadosCriacaoProduto,
  FiltrosListagemProdutos,
  ProdutoRepository,
  ResultadoPaginado,
} from '../domain/produto.repository';
import type { Produto as ProdutoPrisma, Prisma } from '@prisma/client';

@Injectable()
export class PrismaProdutoRepository extends ProdutoRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodos(): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany();
    return produtos.map((produto) => this.paraDominio(produto));
  }

  async listarComFiltros(filtros: FiltrosListagemProdutos): Promise<ResultadoPaginado<Produto>> {
    const {
      pagina,
      limite,
      busca,
      categoria,
      ativo,
      ordenarPor = 'createdAt',
      direcao = 'desc',
    } = filtros;

    const where: Prisma.ProdutoWhereInput = {};

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
      ];
    }
    if (categoria) where.categoria = categoria;
    if (ativo !== undefined) where.ativo = ativo;

    const [produtos, total] = await this.prisma.$transaction([
      this.prisma.produto.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: { [ordenarPor]: direcao },
      }),
      this.prisma.produto.count({ where }),
    ]);

    return {
      itens: produtos.map((produto) => this.paraDominio(produto)),
      total,
      pagina,
      limite,
    };
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    return produto ? this.paraDominio(produto) : null;
  }

  async buscarPorIds(ids: string[]): Promise<Produto[]> {
    const produtos = await this.prisma.produto.findMany({ where: { id: { in: ids } } });
    return produtos.map((produto) => this.paraDominio(produto));
  }

  async buscarPorSlug(slug: string): Promise<Produto | null> {
    const produto = await this.prisma.produto.findUnique({ where: { slug } });
    return produto ? this.paraDominio(produto) : null;
  }

  async criar(dados: DadosCriacaoProduto): Promise<Produto> {
    const produto = await this.prisma.produto.create({
      data: {
        nome: dados.nome,
        slug: dados.slug,
        preco: dados.preco,
        estoque: dados.estoque,
        descricao: dados.descricao,
        categoria: dados.categoria,
      },
    });
    return this.paraDominio(produto);
  }

  async atualizar(id: string, dados: DadosAtualizacaoProduto): Promise<Produto> {
    const produto = await this.prisma.produto.update({
      where: { id },
      data: {
        nome: dados.nome,
        slug: dados.slug,
        preco: dados.preco,
        estoque: dados.estoque,
        descricao: dados.descricao,
        categoria: dados.categoria,
        ativo: dados.ativo,
      },
    });
    return this.paraDominio(produto);
  }

  private paraDominio(produto: ProdutoPrisma): Produto {
    return new Produto(
      produto.id,
      produto.nome,
      produto.slug,
      Number(produto.preco),
      produto.estoque,
      produto.ativo,
      produto.descricao ?? undefined,
      produto.categoria ?? undefined,
      produto.createdAt,
      produto.updatedAt,
    );
  }
}
