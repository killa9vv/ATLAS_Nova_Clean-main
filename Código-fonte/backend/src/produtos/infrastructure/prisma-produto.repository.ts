import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Produto } from '../domain/produto.entity';
import {
  DadosAtualizacaoProduto,
  DadosCriacaoProduto,
  FiltrosListagemProdutos,
  ItemParaAjustarEstoque,
  ItemParaDecrementarEstoque,
  ProdutoRepository,
  ResultadoPaginado,
} from '../domain/produto.repository';
import { EstoqueInsuficienteException } from '../../carrinho/domain/carrinho.exceptions';
import type { Produto as ProdutoPrisma, Prisma } from '@prisma/client';

/** Cliente Prisma "normal" ou um client de transação (`tx` de `$transaction`) — mesma API pros métodos usados aqui. */
type ClientePrisma = PrismaService | Prisma.TransactionClient;

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
        pesoKg: dados.pesoKg,
        alturaCm: dados.alturaCm,
        larguraCm: dados.larguraCm,
        comprimentoCm: dados.comprimentoCm,
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
        pesoKg: dados.pesoKg,
        alturaCm: dados.alturaCm,
        larguraCm: dados.larguraCm,
        comprimentoCm: dados.comprimentoCm,
      },
    });
    return this.paraDominio(produto);
  }

  async decrementarEstoque(itens: ItemParaDecrementarEstoque[], contexto?: unknown): Promise<void> {
    const decrementar = async (cliente: ClientePrisma) => {
      for (const item of itens) {
        const resultado = await cliente.produto.updateMany({
          where: { id: item.produtoId, estoque: { gte: item.quantidade } },
          data: { estoque: { decrement: item.quantidade } },
        });

        if (resultado.count === 0) {
          throw new EstoqueInsuficienteException(item.nome);
        }
      }
    };

    // Se já rodamos dentro de uma transação externa (contexto vindo de
    // TransactionManager, ex.: junto da criação do pedido), reaproveita o mesmo
    // client em vez de abrir uma transação aninhada. Sem contexto, abre a própria
    // transação — mantém o método atômico também quando usado sozinho.
    if (contexto) {
      await decrementar(contexto as Prisma.TransactionClient);
      return;
    }
    await this.prisma.$transaction((tx) => decrementar(tx));
  }

  async incrementarEstoque(itens: ItemParaAjustarEstoque[], contexto?: unknown): Promise<void> {
    const incrementar = async (cliente: ClientePrisma) => {
      for (const item of itens) {
        await cliente.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { increment: item.quantidade } },
        });
      }
    };

    if (contexto) {
      await incrementar(contexto as Prisma.TransactionClient);
      return;
    }
    await this.prisma.$transaction((tx) => incrementar(tx));
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
      produto.pesoKg !== null ? Number(produto.pesoKg) : undefined,
      produto.alturaCm !== null ? Number(produto.alturaCm) : undefined,
      produto.larguraCm !== null ? Number(produto.larguraCm) : undefined,
      produto.comprimentoCm !== null ? Number(produto.comprimentoCm) : undefined,
    );
  }
}
