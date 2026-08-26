import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Categoria } from '../domain/categoria.entity';
import {
  CategoriaRepository,
  DadosAtualizacaoCategoria,
  DadosCriacaoCategoria,
} from '../domain/categoria.repository';
import type { Categoria as CategoriaPrisma } from '@prisma/client';

@Injectable()
export class PrismaCategoriaRepository extends CategoriaRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listarTodas(): Promise<Categoria[]> {
    const categorias = await this.prisma.categoria.findMany({ orderBy: { nome: 'asc' } });
    return categorias.map((categoria) => this.paraDominio(categoria));
  }

  async buscarPorId(id: string): Promise<Categoria | null> {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    return categoria ? this.paraDominio(categoria) : null;
  }

  async buscarPorSlug(slug: string): Promise<Categoria | null> {
    const categoria = await this.prisma.categoria.findUnique({ where: { slug } });
    return categoria ? this.paraDominio(categoria) : null;
  }

  async criar(dados: DadosCriacaoCategoria): Promise<Categoria> {
    const categoria = await this.prisma.categoria.create({
      data: { slug: dados.slug, nome: dados.nome },
    });
    return this.paraDominio(categoria);
  }

  async atualizar(id: string, dados: DadosAtualizacaoCategoria): Promise<Categoria> {
    const categoria = await this.prisma.categoria.update({
      where: { id },
      data: { nome: dados.nome },
    });
    return this.paraDominio(categoria);
  }

  async excluir(id: string): Promise<void> {
    await this.prisma.categoria.delete({ where: { id } });
  }

  async possuiProdutosVinculados(id: string): Promise<boolean> {
    const [totalProdutos, totalProdutoTipos] = await Promise.all([
      this.prisma.produto.count({ where: { categoriaId: id } }),
      this.prisma.produtoTipo.count({ where: { categoriaId: id } }),
    ]);
    return totalProdutos > 0 || totalProdutoTipos > 0;
  }

  private paraDominio(categoria: CategoriaPrisma): Categoria {
    return new Categoria(categoria.id, categoria.slug, categoria.nome);
  }
}
